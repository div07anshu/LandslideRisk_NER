import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

/**
 * Resolves the current user's application role from the backend (`profiles`
 * table, via GET /api/auth/me) — the same source of truth the backend's
 * requireAdmin middleware checks. This is for UX only (hiding/showing admin
 * navigation, redirecting); the real authorization boundary is server-side.
 */
export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadRole() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          if (active) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          if (active) {
            setRole(null);
            setError("Failed to resolve account role.");
          }
          return;
        }

        const body = await res.json();
        if (active) setRole(body?.user?.role ?? null);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setRole(null);
          setError("Failed to resolve account role.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRole();

    return () => {
      active = false;
      controller.abort();
    };
  }, [user, authLoading]);

  return {
    role,
    isAdmin: role === "ADMIN",
    loading: authLoading || loading,
    error,
  };
}
