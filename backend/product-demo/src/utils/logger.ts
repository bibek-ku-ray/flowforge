import { env } from "../config/env.js";

type LogMeta = Record<string, unknown> | undefined;

function format(level: string, message: string, meta?: LogMeta): string {
  const ts = new Date().toISOString();
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${ts}] [${level}] ${message}${suffix}`;
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(format("INFO", message, meta));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(format("WARN", message, meta));
  },
  error(message: string, error?: unknown, meta?: LogMeta): void {
    const errMeta =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
    console.error(format("ERROR", message, errMeta));
  },
  debug(message: string, meta?: LogMeta): void {
    if (env.NODE_ENV === "development") {
      console.debug(format("DEBUG", message, meta));
    }
  },
};
