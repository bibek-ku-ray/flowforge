"use client";

import {useEffect, useLayoutEffect, useRef} from "react";
import "./globals.css";
import Link from "next/link";

/**
 * Root-level error UI: when this renders it replaces `app/layout.tsx`, so we must
 * supply our own `<html>` / `<body>` and re-import global styles (see Next.js docs).
 */
/** Mirrors Next.js `ErrorInfo` so this file type-checks as an App Router error component. */
export type GlobalErrorProps = {
  error: Error & {digest?: string};
  reset: () => void;
  unstable_retry: () => void;
};

const isDev = process.env.NODE_ENV === "development";

function normalizeError(
  raw: Error | null | undefined,
): Error & {digest?: string} {
  if (raw instanceof Error) {
    return raw as Error & {digest?: string};
  }
  return new Error("Something went wrong");
}

/**
 * Dev: full details for debugging. Prod: structured, low-sensitivity fields only
 * (avoid logging user-controlled `message` / stacks that may contain PII).
 */
function logGlobalError(error: Error & {digest?: string}) {
  if (isDev) {
    console.error("[global-error]", error);
    return;
  }

  console.error("[global-error]", {
    digest: error.digest ?? null,
    name: error.name,
  });
}

export default function GlobalError({error, reset}: GlobalErrorProps) {
  const safeError = normalizeError(error);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    logGlobalError(safeError);
  }, [safeError]);

  useLayoutEffect(() => {
    headingRef.current?.focus();
  }, []);

  const userMessage =
    safeError.digest != null
      ? "We hit a problem on our side. You can try again or return home."
      : "Something went wrong. Please try again or go back to the home page.";

  return (
    <html lang="en">
      <head>
        <title>Error — FlowForge</title>
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div
          aria-live="assertive"
          className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
          role="alert"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
            <h1
              className="font-heading text-xl font-semibold tracking-tight text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              ref={headingRef}
              tabIndex={-1}
            >
              This page couldn&apos;t load
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{userMessage}</p>

            {isDev && (
              <details className="mt-6 rounded-md border border-border bg-muted/50 p-3 text-left text-xs">
                <summary className="cursor-pointer font-medium text-foreground">
                  Debug details (development only)
                </summary>
                <dl className="mt-2 space-y-1 font-mono text-muted-foreground">
                  {safeError.digest != null && (
                    <>
                      <dt className="text-[0.65rem] uppercase opacity-80">Digest</dt>
                      <dd className="break-all">{safeError.digest}</dd>
                    </>
                  )}
                  <dt className="text-[0.65rem] uppercase opacity-80">Message</dt>
                  <dd className="wrap-break-word">{safeError.message}</dd>
                  {safeError.stack != null && (
                    <>
                      <dt className="pt-2 text-[0.65rem] uppercase opacity-80">Stack</dt>
                      <dd className="max-h-40 overflow-auto whitespace-pre-wrap break-all">
                        {safeError.stack}
                      </dd>
                    </>
                  )}
                </dl>
              </details>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => reset()}
                type="button"
              >
                Try again
              </button>
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href="/"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
