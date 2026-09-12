import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import SectionHeader from "../../common/SectionHeader";
import Card from "../../common/Card";
import { adminFetch } from "../../api/adminApi";

const PAGE_SIZE = 20;

const ACTIONS = [
  "REPORT_STATUS_CHANGED",
  "USER_ROLE_CHANGED",
  "RISK_ZONE_CREATED",
  "RISK_ZONE_UPDATED",
  "RISK_ZONE_DELETED",
  "RISK_CONFIG_UPDATED",
];
const ACTION_FILTERS = ["All", ...ACTIONS];

const RESOURCE_TYPES = ["report", "user", "risk_zone", "risk_config"];
const RESOURCE_TYPE_FILTERS = ["All", ...RESOURCE_TYPES];

function describeMetadata(t, action, metadata) {
  if (!metadata) return null;

  switch (action) {
    case "REPORT_STATUS_CHANGED":
      return t("admin.auditLogs.descriptions.reportStatusChanged", {
        oldStatus: metadata.oldStatus,
        newStatus: metadata.newStatus,
      });
    case "USER_ROLE_CHANGED":
      return t("admin.auditLogs.descriptions.userRoleChanged", {
        oldRole: metadata.oldRole,
        newRole: metadata.newRole,
      });
    case "RISK_ZONE_CREATED":
      return t("admin.auditLogs.descriptions.riskZoneCreated", { name: metadata.name });
    case "RISK_ZONE_DELETED":
      return t("admin.auditLogs.descriptions.riskZoneDeleted", { name: metadata.name });
    case "RISK_ZONE_UPDATED":
      return t("admin.auditLogs.descriptions.riskZoneUpdated", {
        fields: Object.keys(metadata.changes ?? {}).join(", ") || "—",
      });
    case "RISK_CONFIG_UPDATED":
      return t("admin.auditLogs.descriptions.riskConfigUpdated", {
        oldLowMax: metadata.oldLowMax,
        oldModerateMax: metadata.oldModerateMax,
        newLowMax: metadata.newLowMax,
        newModerateMax: metadata.newModerateMax,
      });
    default:
      return null;
  }
}

export default function AdminAuditLogs() {
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [actionFilter, setActionFilter] = useState("All");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (actionFilter !== "All") params.set("action", actionFilter);
        if (resourceTypeFilter !== "All") params.set("resourceType", resourceTypeFilter);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));

        const data = await adminFetch(`/api/admin/audit-logs?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!active) return;
        setLogs(data?.logs ?? []);
        setTotal(data?.total ?? 0);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setError(
            err?.status === 403
              ? t("admin.auditLogs.errors.forbidden")
              : err?.status === 422
                ? t("admin.auditLogs.errors.invalidFilter")
                : t("admin.auditLogs.errors.loadFailed"),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [actionFilter, resourceTypeFilter, dateFrom, dateTo, page, t]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, resourceTypeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex-1">
      <SectionHeader title={t("admin.auditLogs.title")} subtitle={t("admin.auditLogs.subtitle")} />

      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              {t("admin.auditLogs.filters.action")}
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              {ACTION_FILTERS.map((a) => (
                <option key={a} value={a}>
                  {a === "All" ? t("common.all") : t(`admin.auditLogs.actions.${a}`, a)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              {t("admin.auditLogs.filters.resourceType")}
            </label>
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              {RESOURCE_TYPE_FILTERS.map((r) => (
                <option key={r} value={r}>
                  {r === "All" ? t("common.all") : t(`admin.auditLogs.resourceTypes.${r}`, r)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              {t("admin.auditLogs.filters.dateFrom")}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              {t("admin.auditLogs.filters.dateTo")}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
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
            {loading ? t("common.loading") : t("admin.auditLogs.entriesFound", { count: total })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                <th className="px-5 py-2">{t("admin.auditLogs.columns.timestamp")}</th>
                <th className="px-5 py-2">{t("admin.auditLogs.columns.actor")}</th>
                <th className="px-5 py-2">{t("admin.auditLogs.columns.action")}</th>
                <th className="px-5 py-2">{t("admin.auditLogs.columns.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin motion-reduce:animate-none" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                    {t("admin.auditLogs.noEntriesFound")}
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {log.actorEmail ?? t("admin.auditLogs.unknownActor")}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-bold rounded-full px-2.5 py-1 inline-block bg-slate-100 text-slate-700">
                        {t(`admin.auditLogs.actions.${log.action}`, log.action)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {describeMetadata(t, log.action, log.metadata) ?? "—"}
                    </td>
                  </tr>
                ))}
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
