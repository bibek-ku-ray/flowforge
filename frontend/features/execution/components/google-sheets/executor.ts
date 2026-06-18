import { NonRetriableError } from "inngest";
import { google } from "googleapis";
import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";
import { makeStepId } from "@/features/execution/lib/step-id";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

type GoogleSheetsData = {
  variableName?: string;
  credentialId?: string;
  spreadsheetId?: string;
  worksheet?: string;
};

/**
 * Convert a sheet value matrix into an array of row objects keyed by the header
 * row. `[["Name","Email"],["Ada","ada@x.io"]]` -> `[{ Name:"Ada", Email:"ada@x.io" }]`.
 */
function rowsToObjects(values: string[][]): Record<string, string>[] {
  if (values.length === 0) return [];
  const [headers, ...rows] = values;
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? "";
    });
    return obj;
  });
}

export const googleSheetsExecutor: NodeExecutor<GoogleSheetsData> = async ({
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
      throw new NonRetriableError("Google Sheets node: Variable name is missing");
    }
    if (!data.credentialId) {
      throw new NonRetriableError("Google Sheets node: Credential is required");
    }
    if (!data.spreadsheetId) {
      throw new NonRetriableError("Google Sheets node: Spreadsheet ID is required");
    }

    const credential = await step.run(
      makeStepId("sheets-get-credential", nodeId, iterationKey),
      () =>
        prisma.credential.findUnique({
          where: { id: data.credentialId, userId },
        }),
    );

    if (!credential) {
      throw new NonRetriableError("Google Sheets node: Credential not found");
    }

    const result = await step.run(
      makeStepId("sheets-read", nodeId, iterationKey),
      async () => {
        let serviceAccount: Record<string, unknown>;
        try {
          serviceAccount = JSON.parse(decrypt(credential.value));
        } catch {
          throw new NonRetriableError(
            "Google Sheets node: Credential must be valid service-account JSON",
          );
        }

        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const range = data.worksheet?.trim() || "Sheet1";

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: data.spreadsheetId,
          range,
        });

        const values = (response.data.values ?? []) as string[][];
        const rows = rowsToObjects(values);

        return {
          ...context,
          [data.variableName as string]: { rows },
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
