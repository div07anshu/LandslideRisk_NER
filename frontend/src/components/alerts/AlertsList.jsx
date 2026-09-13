import { Search } from "lucide-react";
import Card from "../../common/Card";
import AlertLevelBadge from "./AlertLevelBadge";
import {
  ALERT_LEVEL_FILTERS,
  ALERT_STATUS_STYLES,
} from "../../data/alertsData";
import { useTranslation } from "react-i18next";

export default function AlertsList({
  alerts,
  levelFilter,
  setLevelFilter,
  search,
  setSearch,
  loading = false,
}) {
  const { t } = useTranslation();

  return (
    <Card className="h-full flex flex-col">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-900">
              {t("alerts.allAlerts")}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t("alerts.alertsFound", { count: alerts.length })}
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
              placeholder={t("alerts.searchPlaceholder")}
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
              {t(`alerts.levels.${lvl.toLowerCase()}`, lvl)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pb-4 divide-y divide-slate-200 overflow-y-auto flex-1">
        {loading && (
          <p className="text-sm text-slate-400 py-6 text-center">
            {t("alerts.loadingAlerts", "Loading alerts…")}
          </p>
        )}

        {!loading && alerts.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">
            {t("alerts.noAlertsFound")}
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
                    {t(`alerts.status.${String(a.status || "active").toLowerCase()}`, a.status || "Active")}
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