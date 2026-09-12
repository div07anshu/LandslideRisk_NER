import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

import SectionHeader from "../../common/SectionHeader";
import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";
import { adminFetch } from "../../api/adminApi";

export default function AdminConfig() {
  const { t } = useTranslation();

  const [thresholds, setThresholds] = useState(null);
  const [lowMax, setLowMax] = useState("");
  const [moderateMax, setModerateMax] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await adminFetch("/api/admin/risk-config", { signal: controller.signal });
        if (!active) return;
        setThresholds(data);
        setLowMax(String(data.lowMax));
        setModerateMax(String(data.moderateMax));
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setLoadError(
            err?.status === 403
              ? t("admin.config.errors.forbidden")
              : t("admin.config.errors.loadFailed"),
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
  }, [t]);

  const lowMaxNum = Number(lowMax);
  const moderateMaxNum = Number(moderateMax);
  const clientError =
    lowMax === "" || moderateMax === ""
      ? ""
      : !Number.isFinite(lowMaxNum) || !Number.isFinite(moderateMaxNum)
        ? t("admin.config.validation.mustBeNumbers")
        : lowMaxNum <= 0 || lowMaxNum >= 100
          ? t("admin.config.validation.lowMaxRange")
          : moderateMaxNum <= 0 || moderateMaxNum > 100
            ? t("admin.config.validation.moderateMaxRange")
            : lowMaxNum >= moderateMaxNum
              ? t("admin.config.validation.order")
              : "";

  async function handleSubmit(e) {
    e.preventDefault();
    if (clientError) return;

    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      const updated = await adminFetch("/api/admin/risk-config", {
        method: "PUT",
        body: { lowMax: lowMaxNum, moderateMax: moderateMaxNum },
      });
      setThresholds(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err?.message || t("admin.config.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1">
      <SectionHeader title={t("admin.config.title")} subtitle={t("admin.config.subtitle")} />

      {loadError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title={t("admin.config.thresholds.title")} />

          {loading ? (
            <div className="px-5 pb-5 space-y-3">
              <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("admin.config.thresholds.lowMax")}
                </label>
                <p className="text-[11px] text-slate-400 mb-1">
                  {t("admin.config.thresholds.lowMaxHint")}
                </p>
                <input
                  type="number"
                  step="0.1"
                  value={lowMax}
                  onChange={(e) => setLowMax(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("admin.config.thresholds.moderateMax")}
                </label>
                <p className="text-[11px] text-slate-400 mb-1">
                  {t("admin.config.thresholds.moderateMaxHint")}
                </p>
                <input
                  type="number"
                  step="0.1"
                  value={moderateMax}
                  onChange={(e) => setModerateMax(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              {clientError && <p className="text-xs text-red-500">{clientError}</p>}
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}

              <button
                type="submit"
                disabled={saving || Boolean(clientError)}
                className="flex items-center justify-center gap-2 bg-brand-950 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? t("common.loading") : t("common.save")}
              </button>

              {saved && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <CheckCircle2 size={14} strokeWidth={3} />
                  {t("admin.config.saved")}
                </div>
              )}
            </form>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-[16px] font-bold mb-3">{t("admin.config.explainer.title")}</h3>
          <p className="text-sm text-slate-600 mb-3">{t("admin.config.explainer.body")}</p>

          {thresholds && (
            <div className="flex flex-col gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex justify-between">
                <span className="font-semibold text-green-700">{t("riskLevels.low")}</span>
                <span className="text-slate-500">{t("admin.config.explainer.scoreBelow", { value: thresholds.lowMax })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-amber-700">{t("riskLevels.moderate")}</span>
                <span className="text-slate-500">
                  {t("admin.config.explainer.scoreBetween", { min: thresholds.lowMax, max: thresholds.moderateMax })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-red-700">{t("riskLevels.high")}</span>
                <span className="text-slate-500">{t("admin.config.explainer.scoreAbove", { value: thresholds.moderateMax })}</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-3">{t("admin.config.explainer.note")}</p>
        </Card>
      </div>
    </div>
  );
}
