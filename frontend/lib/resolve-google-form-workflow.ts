import { prisma } from "@/lib/prisma";
import type { Node, Prisma } from "@/generated/prisma/client";

type GoogleFormTriggerNode = Pick<Node, "id" | "workflowId" | "data">;

export type ResolvedGoogleFormWorkflow = {
  workflowId: string;
  triggerNode: GoogleFormTriggerNode;
  resolvedBy: "url" | "formId" | "single-fallback";
  requestedWorkflowId: string;
};

function getStoredFormId(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const formId = (data as Record<string, unknown>).formId;
  return typeof formId === "string" && formId.length > 0 ? formId : undefined;
}

function getFormIdClaimedAt(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const claimedAt = (data as Record<string, unknown>).formIdClaimedAt;
  return typeof claimedAt === "string" ? claimedAt : "";
}

export async function resolveGoogleFormWorkflow(
  requestedWorkflowId: string,
  formId?: string,
): Promise<ResolvedGoogleFormWorkflow | { error: string; status: number }> {
  const requestedWorkflow = await prisma.workflow.findUnique({
    where: { id: requestedWorkflowId },
    include: {
      nodes: {
        where: { type: "GOOGLE_FORM_TRIGGER" },
        select: { id: true, workflowId: true, data: true },
      },
    },
  });

  if (!requestedWorkflow) {
    return { error: `Workflow not found: ${requestedWorkflowId}`, status: 404 };
  }

  const urlTrigger = requestedWorkflow.nodes[0];
  if (urlTrigger) {
    const storedFormId = getStoredFormId(urlTrigger.data);
    if (storedFormId && formId && storedFormId !== formId) {
      return {
        error: `Form ID mismatch. This workflow expects form ${storedFormId}, but received ${formId}.`,
        status: 400,
      };
    }

    return {
      workflowId: requestedWorkflowId,
      triggerNode: urlTrigger,
      resolvedBy: "url",
      requestedWorkflowId,
    };
  }

  const candidateTriggers = await prisma.node.findMany({
    where: {
      type: "GOOGLE_FORM_TRIGGER",
      workflow: { userId: requestedWorkflow.userId },
    },
    select: { id: true, workflowId: true, data: true },
  });

  if (formId) {
    const matches = candidateTriggers.filter(
      (node) => getStoredFormId(node.data) === formId,
    );

    if (matches.length > 0) {
      const bestMatch = [...matches].sort((a, b) =>
        getFormIdClaimedAt(b.data).localeCompare(getFormIdClaimedAt(a.data)),
      )[0]!;

      return {
        workflowId: bestMatch.workflowId,
        triggerNode: bestMatch,
        resolvedBy: "formId",
        requestedWorkflowId,
      };
    }
  }

  if (candidateTriggers.length === 1) {
    return {
      workflowId: candidateTriggers[0]!.workflowId,
      triggerNode: candidateTriggers[0]!,
      resolvedBy: "single-fallback",
      requestedWorkflowId,
    };
  }

  const available = candidateTriggers
    .map((node) => {
      const storedFormId = getStoredFormId(node.data);
      return storedFormId
        ? `${node.workflowId} (form ${storedFormId})`
        : node.workflowId;
    })
    .join(", ");

  return {
    error: `Workflow ${requestedWorkflowId} does not have a Google Form trigger. Open the Google Form trigger settings for the workflow you are editing, save your Google Form ID, and re-copy the webhook URL.${
      available ? ` Configured workflows: ${available}` : ""
    }`,
    status: 400,
  };
}

export async function claimGoogleFormId(
  userId: string,
  triggerNodeId: string,
  formId: string,
  existingData: unknown,
) {
  const allTriggers = await prisma.node.findMany({
    where: {
      type: "GOOGLE_FORM_TRIGGER",
      workflow: { userId },
    },
    select: { id: true, data: true },
  });

  for (const node of allTriggers) {
    if (node.id === triggerNodeId) continue;

    const data = (node.data as Record<string, unknown>) || {};
    if (data.formId !== formId) continue;

    const nextData = { ...data };
    delete nextData.formId;
    delete nextData.formIdClaimedAt;

    await prisma.node.update({
      where: { id: node.id },
      data: { data: nextData as Prisma.InputJsonValue },
    });
  }

  const data =
    existingData && typeof existingData === "object"
      ? { ...(existingData as Record<string, unknown>) }
      : {};

  return prisma.node.update({
    where: { id: triggerNodeId },
    data: {
      data: {
        ...data,
        formId,
        formIdClaimedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}
