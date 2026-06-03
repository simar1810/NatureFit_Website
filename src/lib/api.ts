/**
 * API base URL and shared fetch client for backend (NutriChef / Livit).
 * All requests use base path /api/v1.
 * Bearer tokens are injected automatically via tokenManager.
 */

import { ensureToken, clearTokens } from "./tokenManager";
import { getApiBaseUrl, getTenantId } from "./apiBase";

export { getApiBaseUrl } from "./apiBase";

const API_BASE_PATH = "";

/** Backend success/error response envelope */
export interface ApiResponse<T = unknown> {
  status_code: number;
  message: string;
  data: T | null;
}

/** Field-level validation error from backend */
export interface ApiFieldError {
  path?: string;
  message?: string;
}

/** Options for tenant-scoped requests */
export interface ApiRequestOptions {
  /** Tenant ID for X-Tenant-Id header */
  tenantId?: string | null;
  /** Skip automatic token injection (e.g. for the token-generate call itself) */
  skipAuth?: boolean;
}

function getFullUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithBase = normalizedPath.startsWith(API_BASE_PATH)
    ? normalizedPath
    : `${API_BASE_PATH}${normalizedPath}`;
  return `${base}${pathWithBase}`;
}

async function buildHeaders(
  options: ApiRequestOptions = {}
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const tenantId = options.tenantId ?? getTenantId();
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }

  if (!options.skipAuth) {
    const token = await ensureToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const raw = await res.json().catch(() => ({}));
  const payload: ApiResponse<T> =
    typeof raw.status_code === "number"
      ? raw
      : {
          status_code: res.status,
          message: raw.message ?? res.statusText ?? "Request failed",
          data: raw.data ?? null,
        };

  if (!res.ok) {
    const err = new ApiError(
      payload.message,
      res.status,
      payload.data as ApiFieldError[] | null
    );
    throw err;
  }

  return payload;
}

/**
 * Thrown when the backend returns a non-2xx status.
 * message and statusCode match the response; data may contain field errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data: ApiFieldError[] | null = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Execute a fetch, and on 401 clear the stale token, get a fresh one, and retry once.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: ApiRequestOptions
): Promise<Response> {
  const res = await fetch(url, init);

  if (res.status === 401 && !options.skipAuth) {
    clearTokens();
    const freshToken = await ensureToken();
    const retryHeaders = { ...(init.headers as Record<string, string>) };
    retryHeaders["Authorization"] = `Bearer ${freshToken}`;
    return fetch(url, { ...init, headers: retryHeaders });
  }

  return res;
}

/**
 * Shared API client: builds full URL, sets JSON / tenant / auth headers,
 * parses JSON and throws ApiError on non-2xx. Retries once on 401.
 */
export const apiClient = {
  async get<T>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = getFullUrl(path);
    const headers = await buildHeaders(options);
    const res = await fetchWithRetry(url, { method: "GET", headers }, options);
    return handleResponse<T>(res);
  },

  async post<T>(
    path: string,
    body?: unknown,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = getFullUrl(path);
    const headers = await buildHeaders(options);
    const res = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      },
      options
    );
    return handleResponse<T>(res);
  },

  async put<T>(
    path: string,
    body?: unknown,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = getFullUrl(path);
    const headers = await buildHeaders(options);
    const res = await fetchWithRetry(
      url,
      {
        method: "PUT",
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      },
      options
    );
    return handleResponse<T>(res);
  },
};
