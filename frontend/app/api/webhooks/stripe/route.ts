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

    const stripeData = {
      // Event metadata
      eventId: body.id,
      eventType: body.type,
      timestamp: body.created,
      livemode: body.livemode,
      raw: body.data?.object,
    };

    await sendWorkflowExecution(
      {
        workflowId,
        initialData: {
          stripe: stripeData,
        },
      },
      { triggerKind: TriggerKind.STRIPE },
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

    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Stripe event" },
      { status: 500 },
    );
  }
};