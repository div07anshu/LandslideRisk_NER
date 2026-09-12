import { supabase } from "../supabase";

const API_BASE =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export class AdminApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetches an /api/admin/* endpoint with the current Supabase access token
 * attached, following the same auth pattern used by RiskAnalysis/AdminDashboard.
 * Throws AdminApiError on any non-2xx response so callers can branch on
 * `.status` (401/403/404/422/500) the way the rest of the app does.
 */
export async function adminFetch(path, { method = "GET", body, signal } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  if (!token) {
    throw new AdminApiError(401, "Not authenticated");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const json = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new AdminApiError(res.status, json?.error?.message || "Request failed");
  }

  return json?.data;
}
