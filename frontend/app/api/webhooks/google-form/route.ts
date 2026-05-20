import { sendWorkflowExecution } from "@/inngest/utils";
import {
  resolveGoogleFormWorkflow,
} from "@/lib/resolve-google-form-workflow";
import {
  resetCachedExecution,
  setCachedNodeStatus,
} from "@/lib/execution-status-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get("workflowId");

  return NextResponse.json({
    success: true,
    message: "Google Form webhook endpoint is active",
    workflowId: workflowId ?? null,
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const requestedWorkflowId = url.searchParams.get("workflowId");

  try {
    if (!requestedWorkflowId) {
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

    const resolved = await resolveGoogleFormWorkflow(
      requestedWorkflowId,
      typeof formData.formId === "string" ? formData.formId : undefined,
    );

    if ("error" in resolved) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status },
      );
    }

    const { workflowId, triggerNode, resolvedBy } = resolved;

    await resetCachedExecution(workflowId);
    await setCachedNodeStatus(
      workflowId,
      triggerNode.id,
      "loading",
      "GOOGLE_FORM_TRIGGER",
    );

    await sendWorkflowExecution({
      workflowId,
      initialData: {
        googleForm: formData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Google Form submission received",
      workflowId,
      resolvedBy,
      requestedWorkflowId,
    });
  } catch (error) {
    console.error("Google form webhook error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 },
    );
  }
}
