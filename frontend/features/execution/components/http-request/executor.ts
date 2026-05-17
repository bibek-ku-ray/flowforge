import { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import Handlebars from "handlebars";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 3);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type HttpRequestData = {
  variableName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const HttpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
  // publish,
}) => {
  if (!data.endpoint) {
    throw new NonRetriableError("Http request node: No endpoint configured");
  }

  if (!data.variableName) {
    throw new NonRetriableError("variable Name not configured");
  }

  if (!data.method) {
    throw new NonRetriableError("Method not configured");
  }

  try {
    const result = await step.run("http-trigger", async () => {
      const endpoint = Handlebars.compile(data.endpoint)(context);
      const method = data.method;

      const options: KyOptions = { method };

      if (["POST", "PUT", "PATCH"].includes(method)) {
        const resolved = Handlebars.compile(data.body || "{}")(context);
        JSON.parse(resolved);
        options.body = data.body;
        options.headers = {
          "Content-Type": "application/json",
        };
      }

      const response = await ky(endpoint, options);
      const contentType = response.headers.get("content-type");
      const responseData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      const responsePayload = {
        HttpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      };

      return {
        ...context,
        [data.variableName]: responsePayload,
      };
    });

    return result;
  } catch (error) {
    throw error;
  }
};
