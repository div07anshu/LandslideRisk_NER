import { AlertTriangle } from "lucide-react";
import Card from "../../common/Card";
import { LEVEL_STYLES } from "../../data/analysisData";
import { useTranslation } from "react-i18next";

const LEVELS = ["high", "moderate", "low"];

export default function AlertsSummary({ alerts }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
      <Card className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} strokeWidth={3} className="text-[#0B1B3B]" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">
            {alerts.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{t("alerts.totalAlerts")}</div>
        </div>
      </Card>

      {LEVELS.map((level) => {
        const style = LEVEL_STYLES[level];
        const count = alerts.filter((a) => a.level === level).length;

        return (
          <Card key={level} className="p-5 flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-full ${style.bg} flex items-center justify-center shrink-0`}
            >
              <AlertTriangle size={18} strokeWidth={3} className={style.text} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t(`riskLevels.${level}`)} {t("common.risk")}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}