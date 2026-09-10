import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../../common/Card";
import { useTranslation } from "react-i18next";

function ReportProblem() {
  const { t } = useTranslation();

  return (
    <Card className="p-5 flex flex-col items-start">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle size={18} strokeWidth={3} className="text-red-500" />
      </div>
      <h3 className="text-sm font-bold">{t("dashboard.reportProblem.title")}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        {t("dashboard.reportProblem.description")}
      </p>
      <Link
        to="/reports"
        className="mt-auto w-full bg-brand-950 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-brand-800 transition-colors text-center"
      >
        {t("dashboard.reportProblem.button")}
      </Link>
    </Card>
  );
}

export default ReportProblem;