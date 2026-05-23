import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string | undefined)?.trim() || randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
