import { sendWorkflowExecution } from "@/inngest/utils";
import { NextRequest, NextResponse } from "next/server";

function logWebhook(
  level: "info" | "error",
  message: string,
  meta?: Record<string, unknown>,
) {
  const entry = {
    timestamp: new Date().toISOString(),
    source: "google-form-webhook",
    message,
    ...meta,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get("workflowId");

  logWebhook("info", "Health check", {
    method: "GET",
    workflowId,
    url: request.url,
  });

  return NextResponse.json({
    success: true,
    message: "Google Form webhook endpoint is active",
    workflowId: workflowId ?? null,
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const workflowId = url.searchParams.get("workflowId");

  logWebhook("info", "Incoming webhook request", {
    method: "POST",
    workflowId,
    url: request.url,
    contentType: request.headers.get("content-type"),
    userAgent: request.headers.get("user-agent"),
  });

  try {
    if (!workflowId) {
      logWebhook("error", "Missing workflowId query parameter");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required query parameters: workflowId",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const formData = {
      formId: body.formId,
      formTitle: body.formTitle,
      responseId: body.responseId,
      timestamp: body.timestamp,
      respondentEmail: body.respondentEmail,
      responses: body.responses,
      raw: body,
    };

    logWebhook("info", "Processing form submission", {
      workflowId,
      formId: formData.formId,
      responseId: formData.responseId,
    });

    await sendWorkflowExecution({
      workflowId,
      initialData: {
        googleForm: formData,
      },
    });

    logWebhook("info", "Workflow execution queued", { workflowId });

    return NextResponse.json({
      success: true,
      message: "Google Form submission received",
      workflowId,
    });
  } catch (error) {
    logWebhook("error", "Google form webhook error", {
      workflowId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 },
    );
  }
}
