import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, User, Calendar } from "lucide-react";
import Modal from "../../common/Modal";
import StatusBadge from "../reports/StatusBadge";
import { categoryMeta, STATUS_FILTERS } from "../../data/reportsData";
import { adminFetch } from "../../api/adminApi";

const REPORT_STATUSES = STATUS_FILTERS.filter((s) => s !== "All");

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || "");
}

export default function ReportDetailModal({ reportId, onClose, onStatusChanged }) {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await adminFetch(`/api/admin/reports/${reportId}`, {
          signal: controller.signal,
        });
        if (!active) return;
        setReport(data?.report ?? null);
        setRiskData(data?.riskData ?? null);
        setStatus(data?.report?.status ?? "");
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) setError(t("admin.reports.detail.loadError"));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reportId, t]);

  async function handleStatusSave() {
    if (!report || status === report.status) return;

    setSaving(true);
    setSaveError("");

    try {
      const updated = await adminFetch(`/api/admin/reports/${reportId}/status`, {
        method: "PATCH",
        body: { status },
      });
      setReport(updated);
      onStatusChanged?.(updated);
    } catch {
      setSaveError(t("admin.reports.detail.statusSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t("admin.reports.detail.title")} onClose={onClose}>
      {loading && (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin motion-reduce:animate-none" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {!loading && !error && report && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                {(() => {
                  const cat = categoryMeta(report.category);
                  const Icon = cat.icon;
                  return <Icon size={18} strokeWidth={3} className="text-slate-500" />;
                })()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{report.title}</h4>
                <p className="text-xs text-slate-500">
                  {t(`reports.categories.${report.category}`, report.category)}
                </p>
              </div>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <p className="text-sm text-slate-700">{report.detail}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} strokeWidth={2.5} />
              {report.location}
            </div>
            <div className="flex items-center gap-1.5">
              <User size={14} strokeWidth={2.5} />
              {report.reporter}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} strokeWidth={2.5} />
              {new Date(report.created_at).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>

          {report.image_url && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                {t("admin.reports.detail.media")}
              </p>
              {isVideoUrl(report.image_url) ? (
                <video
                  src={report.image_url}
                  controls
                  playsInline
                  className="w-full max-h-64 object-contain bg-black rounded-xl border border-gray-200"
                />
              ) : (
                <img
                  src={report.image_url}
                  alt=""
                  className="max-h-64 rounded-xl border border-gray-200"
                />
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              {t("admin.reports.detail.riskPrediction")}
            </p>
            {riskData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div>
                  <span className="text-slate-400 block">{t("riskScoreCard.riskLevel")}</span>
                  <span className="font-semibold text-slate-700">{riskData.Risk_level}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("riskScoreCard.riskScore")}</span>
                  <span className="font-semibold text-slate-700">{riskData.Risk_score}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("factors.rainfall24")}</span>
                  <span className="font-semibold text-slate-700">{riskData.Rainfall}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("factors.slope")}</span>
                  <span className="font-semibold text-slate-700">{riskData.Slope}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("factors.elevation")}</span>
                  <span className="font-semibold text-slate-700">{riskData.Elevation}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {t("admin.reports.detail.noRiskData")}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              {t("admin.reports.detail.changeStatus")}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                {REPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`reports.status.${s.toLowerCase()}`, s)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleStatusSave}
                disabled={saving || status === report.status}
                className="bg-brand-950 text-white text-xs font-semibold rounded-lg px-3.5 py-2 hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? t("common.loading") : t("common.save")}
              </button>
            </div>
            {saveError && <p className="text-xs text-red-500 mt-1.5">{saveError}</p>}
          </div>
        </div>
      )}
    </Modal>
  );
}
