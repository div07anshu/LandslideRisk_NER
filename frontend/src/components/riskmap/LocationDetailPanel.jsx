import { X, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../../common/Card";
import TrendIcon from "../analysis/TrendIcon";
import { LEVEL_STYLES } from "../../data/analysisData";
import { useTranslation } from "react-i18next";

export default function LocationDetailPanel({ selected, onClose }) {
  const { t } = useTranslation();
  if (!selected) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <MapPin size={22} strokeWidth={3} className="text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">
          {t("riskMap.selectLocation")}
        </p>
      </Card>
    );
  }

  const level = LEVEL_STYLES[selected.riskLevel];

  return (
    <Card key={selected.id} className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-slate-900">
            {selected.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{selected.state}</p>
        </div>

        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>

      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-4xl font-bold text-slate-900 tabular-nums">
          {selected.riskScore}
        </span>
        <span className="text-sm text-slate-400">/ 100</span>
      </div>

      <div
        className={`inline-flex items-center gap-1.5 mt-3 w-fit text-xs font-semibold px-3 py-1 rounded-full ${level.bg} ${level.text}`}
      >
        <TrendIcon trend={selected.trend} />
        {t(`riskLevels.${String(selected.riskLevel || "low").toLowerCase()}`, selected.riskLevel || "Low")} {t("common.risk")}
      </div>

      {selected.factors && (
        <div className="mt-5 space-y-2.5">
          {selected.factors.slice(0, 3).map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-slate-500">
                {f.labelKey ? t(f.labelKey, f.label) : t(`factors.${f.key}`, f.label)}
              </span>
              <span className="font-semibold text-slate-700">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/risk-analysis"
        className="mt-auto pt-5 w-full bg-brand-950 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-brand-800 transition-colors text-center"
      >
        {t("riskMap.viewFullAnalysis")}
      </Link>
    </Card>
  );
}