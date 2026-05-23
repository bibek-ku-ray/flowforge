import type { Request, Response } from "express";
import { sendError } from "../utils/api-response.js";

export function notFound(req: Request, res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, "NOT_FOUND");
}
