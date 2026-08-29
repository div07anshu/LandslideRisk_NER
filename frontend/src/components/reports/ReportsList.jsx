import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import Card from "../../common/Card";
import StatusBadge from "./StatusBadge";
import { categoryMeta, STATUS_FILTERS } from "../../data/reportsData";

export default function ReportsList({
  reports,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  loading = false,
}) {
  const prevIdsRef = useRef(new Set());
  const [newIds, setNewIds] = useState(new Set());

  useEffect(() => {
    const currentIds = new Set(reports.map((r) => r.id));
    const added = reports
      .map((r) => r.id)
      .filter((id) => !prevIdsRef.current.has(id));

    if (added.length && prevIdsRef.current.size > 0) {
      setNewIds(new Set(added));
      const timeout = setTimeout(() => setNewIds(new Set()), 1600);
      prevIdsRef.current = currentIds;
      return () => clearTimeout(timeout);
    }

    prevIdsRef.current = currentIds;
  }, [reports]);

  return (
    <Card className="h-full flex flex-col">
      <style>{`
        @keyframes reportItemIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .report-item-enter {
          animation: reportItemIn 280ms ease-out both;
          animation-delay: var(--enter-delay, 0ms);
        }
        @keyframes reportHighlight {
          0% { background-color: rgba(63, 114, 175, 0.12); }
          100% { background-color: transparent; }
        }
        .report-item-new {
          animation: reportHighlight 1600ms ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .report-item-enter, .report-item-new { animation: none; }
        }
      `}</style>

      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-900">
              ALL REPORTS
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {loading
                ? "Loading reports..."
                : `${reports.length} report${reports.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          <div className="relative">
            <Search
              size={14}
              strokeWidth={3}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              aria-label="Search reports"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex bg-slate-100 border border-gray-200 rounded-xl p-1 mt-3 w-fit">
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
              {s === "All" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pb-4 divide-y divide-slate-200 overflow-y-auto flex-1">
        {!loading && reports.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">
            No reports match your filters.
          </p>
        )}

        {loading && (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin motion-reduce:animate-none" />
          </div>
        )}

        {reports.map((r, index) => {
          const cat = categoryMeta(r.category);
          const Icon = cat.icon;
          const isNew = newIds.has(r.id);

          return (
            <div
              key={r.id}
              style={{ "--enter-delay": `${index * 40}ms` }}
              className={`flex items-start gap-3 py-3 rounded-lg px-2 -mx-2 report-item-enter ${
                isNew ? "report-item-new" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={16} strokeWidth={3} className="text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {r.title}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {r.time}
                  </span>
                </div>

                {r.imageUrl && (
                  <img
                    src={r.imageUrl}
                    alt=""
                    className="mt-2 w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                )}

                <p className="text-xs text-slate-500 mt-0.5">{r.detail}</p>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">
                    {r.location}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-400">
                    {r.reporter}
                  </span>
                </div>

                <div className="mt-2">
                  <StatusBadge status={r.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
