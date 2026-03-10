import { toast } from "sonner";

const AUTH_KEY = "mioku_webui_auth";

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function saveAuth(token: string, expiresAt: number): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, expiresAt }));
}

export function getAuthToken(): string | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token: string; expiresAt: number };
    if (!parsed.token || Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return parsed.token;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

function shouldForceLogin(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  return /(unauth|unauthed|unauthorized|token_invalid|forbidden)/i.test(message);
}

function redirectToLogin(): void {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  const hasBody = init?.body != null;
  if (hasBody && !(init?.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (typeof body === "object" && body && "error" in body && String((body as any).error)) ||
      (typeof body === "string" && body) ||
      `Request failed: ${res.status}`;
    if (shouldForceLogin(res.status, message)) {
      clearAuth();
      redirectToLogin();
    }
    toast.error(message);
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

export async function apiForm<T>(url: string, form: FormData): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    method: "POST",
    body: form,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (typeof body === "object" && body && "error" in body && String((body as any).error)) ||
      (typeof body === "string" && body) ||
      `Request failed: ${res.status}`;
    if (shouldForceLogin(res.status, message)) {
      clearAuth();
      redirectToLogin();
    }
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}
