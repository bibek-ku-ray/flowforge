import { TriggerKind } from "@/generated/prisma/enums";
import {
  sendWorkflowExecution,
  TriggerDisabledError,
} from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameter: workflowId" },
        { status: 400 },
      );
    };

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

    await sendWorkflowExecution(
      {
        workflowId,
        initialData: {
          googleForm: formData,
        },
      },
      { triggerKind: TriggerKind.GOOGLE_FORM },
    );

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof TriggerDisabledError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }

    console.error("Google form webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 },
    );
  }
};