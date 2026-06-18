import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { Resend } from "resend";
import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";
import { makeStepId } from "@/features/execution/lib/step-id";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type EmailData = {
  variableName?: string;
  credentialId?: string;
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
};

export const emailExecutor: NodeExecutor<EmailData> = async ({
  data,
  nodeId,
  nodeType,
  workflowId,
  userId,
  context,
  step,
  publish,
  iterationKey,
}) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  try {
    if (!data.variableName) {
      throw new NonRetriableError("Email node: Variable name is missing");
    }
    if (!data.credentialId) {
      throw new NonRetriableError("Email node: Credential is required");
    }
    if (!data.from || !data.to || !data.subject || !data.html) {
      throw new NonRetriableError(
        "Email node: From, To, Subject and HTML body are required",
      );
    }

    const from = Handlebars.compile(data.from)(context);
    const to = Handlebars.compile(data.to)(context);
    const subject = Handlebars.compile(data.subject)(context);
    const html = Handlebars.compile(data.html)(context);

    const credential = await step.run(
      makeStepId("email-get-credential", nodeId, iterationKey),
      () =>
        prisma.credential.findUnique({
          where: { id: data.credentialId, userId },
        }),
    );

    if (!credential) {
      throw new NonRetriableError("Email node: Credential not found");
    }

    const apiKey = decrypt(credential.value);

    const result = await step.run(
      makeStepId("email-send", nodeId, iterationKey),
      async () => {
        const resend = new Resend(apiKey);
        const { data: sent, error } = await resend.emails.send({
          from,
          to,
          subject,
          html,
        });

        if (error) {
          throw new Error(`Email node: ${error.message}`);
        }

        return {
          ...context,
          [data.variableName as string]: {
            id: sent?.id ?? null,
            to,
            subject,
          },
        };
      },
    );

    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "success");
    return result;
  } catch (error) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw error;
  }
};
