import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

import SectionHeader from "../../common/SectionHeader";
import Card from "../../common/Card";
import StatusBadge from "../../components/reports/StatusBadge";
import ReportDetailModal from "../../components/admin/ReportDetailModal";
import { categoryMeta, STATUS_FILTERS } from "../../data/reportsData";
import { adminFetch } from "../../api/adminApi";

const PAGE_SIZE = 10;

export default function AdminReports() {
  const { t } = useTranslation();

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "All") params.set("status", statusFilter);
        if (locationFilter.trim()) params.set("location", locationFilter.trim());
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));

        const data = await adminFetch(`/api/admin/reports?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!active) return;
        setReports(data?.reports ?? []);
        setTotal(data?.total ?? 0);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setError(
            err?.status === 403
              ? t("admin.reports.errors.forbidden")
              : t("admin.reports.errors.loadFailed"),
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
  }, [search, statusFilter, locationFilter, page, t]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex-1">
      <SectionHeader
        title={t("admin.reports.title")}
        subtitle={t("admin.reports.subtitle")}
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
              placeholder={t("admin.reports.searchPlaceholder")}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder={t("admin.reports.locationPlaceholder")}
            className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />

          <div className="flex bg-slate-100 border border-gray-200 rounded-xl p-1 w-fit">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-brand-950 text-white"
                    : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s === "All" ? t("reports.status.all") : t(`reports.status.${s.toLowerCase()}`, s)}
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
              : t("reports.reportsFound", { count: total })}
          </p>
        </div>

        <div className="px-5 pb-2 divide-y divide-slate-200">
          {loading && (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin motion-reduce:animate-none" />
            </div>
          )}

          {!loading && reports.length === 0 && (
            <p className="text-sm text-slate-400 py-8 text-center">
              {t("reports.noReportsFound")}
            </p>
          )}

          {!loading &&
            reports.map((r) => {
              const cat = categoryMeta(r.category);
              const Icon = cat.icon;

              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon size={16} strokeWidth={3} className="text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(r.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-slate-400">{r.location}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400">{r.reporter}</span>
                    </div>
                  </div>

                  <StatusBadge status={r.status} />

                  <button
                    onClick={() => setSelectedId(r.id)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    <Eye size={14} strokeWidth={2.5} />
                    {t("common.viewDetails")}
                  </button>
                </div>
              );
            })}
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

      {selectedId && (
        <ReportDetailModal
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChanged={(updated) => {
            setReports((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)),
            );
          }}
        />
      )}
    </div>
  );
}
