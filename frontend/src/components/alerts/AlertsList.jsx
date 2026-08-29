import { Search } from "lucide-react";
import Card from "../../common/Card";
import AlertLevelBadge from "./AlertLevelBadge";
import {
  ALERT_LEVEL_FILTERS,
  ALERT_STATUS_STYLES,
} from "../../data/alertsData";

function levelFilterLabel(level) {
  return level === "All"
    ? "All"
    : level.charAt(0).toUpperCase() + level.slice(1);
}

function statusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function AlertsList({
  alerts,
  levelFilter,
  setLevelFilter,
  search,
  setSearch,
}) {
  return (
    <Card className="h-full flex flex-col">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-900">
              ALL ALERTS
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""} found
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
              placeholder="Search alerts..."
              aria-label="Search alerts"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>

        {/* Level tabs */}
        <div className="flex bg-slate-100 border border-gray-200 rounded-xl p-1 mt-3 w-fit">
          {ALERT_LEVEL_FILTERS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                levelFilter === lvl
                  ? "bg-brand-950 text-white"
                  : "text-slate-500 hover:bg-slate-200"
              }`}
            >
              {levelFilterLabel(lvl)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pb-4 divide-y divide-slate-200 overflow-y-auto flex-1">
        {alerts.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">
            No alerts match your filters.
          </p>
        )}

        {alerts.map((a) => {
          const Icon = a.icon;
          const statusStyle =
            ALERT_STATUS_STYLES[a.status] ?? ALERT_STATUS_STYLES.ACTIVE;

          return (
            <div key={a.id} className="flex items-start gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={16} strokeWidth={3} className="text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {a.title}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {a.time}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>

                <span className="text-[11px] text-slate-400 mt-1.5 inline-block">
                  {a.location}
                </span>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <AlertLevelBadge level={a.level} />
                  <span
                    className="text-[11px] font-bold rounded-full px-2.5 py-1 inline-block"
                    style={{
                      color: statusStyle.color,
                      backgroundColor: statusStyle.bg,
                    }}
                  >
                    {statusLabel(a.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
