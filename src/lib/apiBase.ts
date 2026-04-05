
export const PROXY_PATH_PREFIX = "/api-backend";

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const backendProxy = process.env.BACKEND_PROXY_TARGET?.trim();
  const serverBase = backendProxy
    ? normalizeBase(backendProxy)
    : publicUrl
      ? normalizeBase(publicUrl)
      : "";

  if (typeof window === "undefined") {
    if (!serverBase) {
      if (process.env.NODE_ENV === "development") {
        throw new Error(
          "Set NEXT_PUBLIC_API_BASE_URL or BACKEND_PROXY_TARGET (e.g. http://localhost:1111)."
        );
      }
      return "";
    }
    return serverBase;
  }

  if (!publicUrl) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local (e.g. http://localhost:1111)."
      );
    }
    return PROXY_PATH_PREFIX;
  }

  if (publicUrl.startsWith("/")) {
    const b = normalizeBase(publicUrl);
    return b || PROXY_PATH_PREFIX;
  }

  try {
    const u = new URL(publicUrl);
    if (u.origin !== window.location.origin) {
      return PROXY_PATH_PREFIX;
    }
    return normalizeBase(publicUrl);
  } catch {
    return PROXY_PATH_PREFIX;
  }
}

export function getTenantId(): string {
  return process.env.NEXT_PUBLIC_TENANT_ID ?? "";
}
