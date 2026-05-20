/**
 * Single source of truth for application URLs.
 *
 * - Browser: always uses `window.location.origin` (works for localhost and ngrok).
 * - Server: resolves from request proxy headers when available, else `APP_URL`.
 * - API clients: prefer relative paths via `getApiPath()` to avoid CORS.
 */

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_ALLOWED_HOSTS = [
  "localhost:3000",
  "127.0.0.1:3000",
  "*.ngrok-free.dev",
  "*.ngrok-free.app",
  "*.ngrok.io",
] as const;

const DEFAULT_ALLOWED_DEV_ORIGINS = [
  "*.ngrok-free.dev",
  "*.ngrok-free.app",
  "*.ngrok.io",
] as const;

function parseCsv(value: string | undefined): string[] {
  return value?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? [];
}

/** Server-only fallback when request headers are unavailable. */
export function getAppUrlFallback(): string {
  return (
    process.env.APP_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    DEFAULT_APP_URL
  );
}

/** Host allowlist for better-auth dynamic `baseURL` (supports ngrok wildcards). */
export function getAllowedHosts(): string[] {
  return [
    ...DEFAULT_ALLOWED_HOSTS,
    ...parseCsv(process.env.APP_ALLOWED_HOSTS),
  ];
}

/** Extra trusted origins for better-auth (optional). */
export function getTrustedOrigins(): string[] {
  const origins = parseCsv(process.env.APP_TRUSTED_ORIGINS);
  return [...new Set([getAppUrlFallback(), ...origins])];
}

/** Next.js `allowedDevOrigins` entries for tunnel / alternate dev hosts. */
export function getAllowedDevOrigins(): string[] {
  return [
    ...DEFAULT_ALLOWED_DEV_ORIGINS,
    ...parseCsv(process.env.APP_ALLOWED_DEV_ORIGINS),
  ];
}

/** Current browser origin. Call only on the client. */
export function getClientAppOrigin(): string {
  if (typeof window === "undefined") {
    throw new Error("getClientAppOrigin() must be called in the browser");
  }
  return window.location.origin;
}

/**
 * Resolves the app origin from an incoming request (ngrok sets x-forwarded-*).
 */
export function getAppOriginFromRequest(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const protocol =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https";
    return `${protocol}://${host}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return getAppUrlFallback();
  }
}

/**
 * Builds an absolute app URL on the server, or a same-origin relative path in the browser.
 */
export function getApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    return normalized;
  }

  return `${getAppUrlFallback()}${normalized}`;
}

/** Absolute app URL for webhooks and shareable links (client-aware). */
export function getAbsoluteAppUrl(path: string, origin?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : getAppUrlFallback());
  return `${base.replace(/\/$/, "")}${normalized}`;
}

/** Polar / better-auth success redirect — relative so it follows the current origin. */
export function getPolarSuccessUrl(): string {
  return process.env.POLAR_SUCCESS_URL ?? "/workflows";
}

export const AUTH_API_BASE_PATH = "/api/auth";

/**
 * Absolute better-auth client base URL (requires protocol).
 * Same-origin in the browser — works for localhost and ngrok.
 */
export function getAuthApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${AUTH_API_BASE_PATH}`;
  }
  return `${getAppUrlFallback()}${AUTH_API_BASE_PATH}`;
}
