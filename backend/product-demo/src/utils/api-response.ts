import type { Response } from "express";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListEnvelope<T> = {
  success: true;
  message: string;
  meta: PaginationMeta;
  data: T[];
};

export type ItemEnvelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorEnvelope = {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
};

export function sendList<T>(
  res: Response,
  statusCode: number,
  message: string,
  meta: PaginationMeta,
  data: T[],
): void {
  const body: ListEnvelope<T> = { success: true, message, meta, data };
  res.status(statusCode).json(body);
}

export function sendItem<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
): void {
  const body: ItemEnvelope<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: unknown,
): void {
  const body: ErrorEnvelope = {
    success: false,
    message,
    error: details === undefined ? { code } : { code, details },
  };
  res.status(statusCode).json(body);
}
