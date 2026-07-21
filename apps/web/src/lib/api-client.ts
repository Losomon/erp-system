import type {
  AuthResponse,
  CurrentUserResponse,
  OrganizationListItem,
  OrganizationMember,
  OrganizationRole,
} from "@atelier/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Access tokens live in memory only (never localStorage) so they can't
// be read by an injected script. They're lost on hard refresh, which
// is why AuthProvider calls /auth/refresh on mount to restore a
// session from the httpOnly refresh-token cookie.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
    credentials: "include", // send/receive the httpOnly refresh-token cookie
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && (body.message?.toString?.() ?? body.error)) || `Request failed (${res.status})`;
    throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
  }

  return body as T;
}

export const api = {
  register: (input: { email: string; password: string; firstName: string; lastName: string }) =>
    apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) }),

  login: (input: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),

  refresh: () => apiFetch<AuthResponse>("/auth/refresh", { method: "POST" }),

  logout: () => apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" }),

  me: () => apiFetch<CurrentUserResponse>("/auth/me"),

  createOrganization: (name: string) =>
    apiFetch<{ id: string; name: string; slug: string }>("/organizations", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  listOrganizations: () => apiFetch<OrganizationListItem[]>("/organizations"),

  listMembers: (organizationId: string) =>
    apiFetch<OrganizationMember[]>(`/organizations/${organizationId}/members`, {
      headers: { "x-organization-id": organizationId },
    }),

  listRoles: (organizationId: string) =>
    apiFetch<OrganizationRole[]>(`/organizations/${organizationId}/roles`, {
      headers: { "x-organization-id": organizationId },
    }),
};
