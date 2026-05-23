import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { sendError } from "../utils/api-response.js";
import { logger } from "../utils/logger.js";

function isMongoDuplicateKeyError(err: unknown): err is { code: number; keyValue?: unknown } {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId;

  if (err instanceof SyntaxError && "body" in err) {
    logger.warn("Malformed JSON body", { requestId, message: err.message });
    sendError(res, 400, "Malformed JSON body", "BAD_REQUEST");
    return;
  }

  if (err instanceof ZodError) {
    logger.warn("Zod validation failed", { requestId, issues: err.issues });
    sendError(res, 400, "Validation failed", "VALIDATION_ERROR", err.flatten());
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    logger.warn("Cast error", { requestId, path: err.path, kind: err.kind });
    sendError(res, 400, "Invalid product id", "INVALID_ID");
    return;
  }

  if (err instanceof ApiError) {
    logger.warn("Handled API error", {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  if (isMongoDuplicateKeyError(err)) {
    const key = err.keyValue as Record<string, unknown> | undefined;
    const slug = key && typeof key.slug === "string" ? key.slug : undefined;
    logger.warn("Duplicate key", { requestId, keyValue: err.keyValue });
    sendError(
      res,
      409,
      "A product with this slug already exists",
      "DUPLICATE_SLUG",
      slug ? { slug } : undefined,
    );
    return;
  }

  logger.error("Unhandled error", err, { requestId });

  const message =
    env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message || "Internal server error";

  sendError(res, 500, message, "INTERNAL_ERROR");
};
