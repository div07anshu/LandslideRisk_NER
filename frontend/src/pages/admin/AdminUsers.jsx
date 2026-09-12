import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";

import SectionHeader from "../../common/SectionHeader";
import Card from "../../common/Card";
import { useAuth } from "../../context/AuthContext";
import { adminFetch } from "../../api/adminApi";

const PAGE_SIZE = 10;
const ROLES = ["ADMIN", "FIELD_OFFICER", "ANALYST", "PUBLIC"];
const ROLE_FILTERS = ["All", ...ROLES];

const ROLE_STYLES = {
  ADMIN: { color: "#7C2D12", bg: "#FFEDD5" },
  FIELD_OFFICER: { color: "#1D4ED8", bg: "#DBEAFE" },
  ANALYST: { color: "#0F766E", bg: "#CCFBF1" },
  PUBLIC: { color: "#475569", bg: "#F1F5F9" },
};

function RoleBadge({ role }) {
  const { t } = useTranslation();
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.PUBLIC;
  return (
    <span
      className="text-[11px] font-bold rounded-full px-2.5 py-1 inline-block"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {t(`admin.users.roles.${role}`, role)}
    </span>
  );
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [savingId, setSavingId] = useState(null);
  const [rowError, setRowError] = useState({});
  const [rowSuccess, setRowSuccess] = useState({});

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (roleFilter !== "All") params.set("role", roleFilter);
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));

        const data = await adminFetch(`/api/admin/users?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!active) return;
        setUsers(data?.users ?? []);
        setTotal(data?.total ?? 0);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setError(
            err?.status === 403
              ? t("admin.users.errors.forbidden")
              : t("admin.users.errors.loadFailed"),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    const debounce = setTimeout(load, 300);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(debounce);
    };
  }, [search, roleFilter, page, t]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  async function handleRoleChange(userId, newRole) {
    setSavingId(userId);
    setRowError((prev) => ({ ...prev, [userId]: "" }));
    setRowSuccess((prev) => ({ ...prev, [userId]: false }));

    try {
      const updated = await adminFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
      );
      setRowSuccess((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => setRowSuccess((prev) => ({ ...prev, [userId]: false })), 2000);
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [userId]:
          err?.status === 409
            ? t("admin.users.errors.lastAdmin")
            : err?.status === 403
              ? t("admin.users.errors.selfChange")
              : t("admin.users.errors.saveFailed"),
      }));
    } finally {
      setSavingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex-1">
      <SectionHeader
        title={t("admin.users.title")}
        subtitle={t("admin.users.subtitle")}
      />

      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              strokeWidth={3}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.users.searchPlaceholder")}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div className="flex bg-slate-100 border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  roleFilter === r
                    ? "bg-brand-950 text-white"
                    : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                {r === "All" ? t("common.all") : t(`admin.users.roles.${r}`, r)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <Card className="flex flex-col">
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-slate-500">
            {loading
              ? t("common.loading")
              : t("admin.users.usersFound", { count: total })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                <th className="px-5 py-2">{t("admin.users.columns.email")}</th>
                <th className="px-5 py-2">{t("admin.users.columns.role")}</th>
                <th className="px-5 py-2">{t("admin.users.columns.registered")}</th>
                <th className="px-5 py-2">{t("admin.users.columns.lastSignIn")}</th>
                <th className="px-5 py-2">{t("admin.users.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin motion-reduce:animate-none" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                    {t("admin.users.noUsersFound")}
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="align-top">
                      <td className="px-5 py-3">
                        <span className="font-medium text-slate-800">
                          {u.email ?? t("admin.users.unknownEmail")}
                        </span>
                        {isSelf && (
                          <span className="ml-2 text-[10px] text-slate-400">
                            {t("admin.users.you")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString([], {
                              dateStyle: "medium",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {u.lastSignInAt
                          ? new Date(u.lastSignInAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : t("admin.users.never")}
                      </td>
                      <td className="px-5 py-3">
                        {isSelf ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <ShieldAlert size={13} strokeWidth={2.5} />
                            {t("admin.users.cannotChangeSelf")}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <select
                              value={u.role}
                              disabled={savingId === u.id}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-50"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {t(`admin.users.roles.${r}`, r)}
                                </option>
                              ))}
                            </select>
                            {rowError[u.id] && (
                              <span className="text-[11px] text-red-500">{rowError[u.id]}</span>
                            )}
                            {rowSuccess[u.id] && (
                              <span className="text-[11px] text-green-600">
                                {t("admin.users.roleUpdated")}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {t("admin.reports.pageOf", { page, totalPages })}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
