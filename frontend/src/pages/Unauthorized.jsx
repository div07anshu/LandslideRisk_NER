import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Unauthorized() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-red-600 text-white flex items-center justify-center">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">403</h1>
        <p className="text-slate-500 mt-2">{t("unauthorized.message")}</p>
        <Link
          to="/"
          className="inline-block mt-6 bg-brand-950 text-white text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-brand-800 transition-colors"
        >
          {t("unauthorized.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
