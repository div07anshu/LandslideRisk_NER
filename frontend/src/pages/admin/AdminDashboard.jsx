import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
} from "lucide-react";

import SectionHeader from "../../common/SectionHeader";
import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";
import MetricCard from "../../components/admin/MetricCard";
import DonutChart from "../../components/dashboard/DonutChart";
import StatusBadge from "../../components/reports/StatusBadge";
import { categoryMeta } from "../../data/reportsData";
import { adminFetch } from "../../api/adminApi";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadStats() {
      setLoading(true);
      setError("");

      try {
        const data = await adminFetch("/api/admin/dashboard/stats", {
          signal: controller.signal,
        });
        if (active) setStats(data ?? null);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (active) {
          setError(
            err?.status === 401
              ? t("admin.dashboard.errors.unauthorized")
              : err?.status === 403
                ? t("admin.dashboard.errors.forbidden")
                : t("admin.dashboard.errors.loadFailed"),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
      controller.abort();
    };
  }, [t]);

  const riskBreakdown = stats?.riskBreakdown ?? { LOW: 0, MODERATE: 0, HIGH: 0 };
  const riskTotal = riskBreakdown.LOW + riskBreakdown.MODERATE + riskBreakdown.HIGH;

  const donutData = [
    { name: t("riskLevels.high"), value: riskBreakdown.HIGH, color: "#DC2626" },
    { name: t("riskLevels.moderate"), value: riskBreakdown.MODERATE, color: "#D97706" },
    { name: t("riskLevels.low"), value: riskBreakdown.LOW, color: "#16A34A" },
  ];

  const metrics = [
    {
      label: t("admin.dashboard.metrics.totalReports"),
      value: stats?.reportCounts?.total ?? 0,
      icon: FileText,
      accent: "#1D4ED8",
    },
    {
      label: t("admin.dashboard.metrics.pendingReports"),
      value: stats?.reportCounts?.pending ?? 0,
      icon: Clock,
      accent: "#B45309",
    },
    {
      label: t("admin.dashboard.metrics.investigatingReports"),
      value: stats?.reportCounts?.investigating ?? 0,
      icon: Search,
      accent: "#1D4ED8",
    },
    {
      label: t("admin.dashboard.metrics.resolvedReports"),
      value: stats?.reportCounts?.resolved ?? 0,
      icon: CheckCircle2,
      accent: "#15803D",
    },
    {
      label: t("admin.dashboard.metrics.highRiskLocations"),
      value: stats?.highRiskLocations ?? 0,
      icon: AlertTriangle,
      accent: "#DC2626",
    },
    {
      label: t("admin.dashboard.metrics.registeredUsers"),
      value: stats?.registeredUsers ?? 0,
      icon: Users,
      accent: "#0F766E",
    },
    {
      label: t("admin.dashboard.metrics.riskAnalyses"),
      value: stats?.riskAnalyses ?? 0,
      icon: Activity,
      accent: "#7C3AED",
    },
  ];

  return (
    <div className="flex-1">
      <SectionHeader
        title={t("admin.dashboard.title")}
        subtitle={t("admin.dashboard.subtitle")}
      />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <Card className="lg:col-span-1 p-6 flex flex-col items-center justify-center">
          <CardHeader title={t("admin.dashboard.riskOverview")} />

          {loading ? (
            <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse" />
          ) : riskTotal === 0 ? (
            <p className="text-sm text-slate-400 text-center px-4">
              {t("admin.dashboard.noRiskData")}
            </p>
          ) : (
            <div className="relative w-32 h-32">
              <DonutChart data={donutData} size={128} thickness={20} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-slate-400">{t("common.totalAreas")}</span>
                <span className="text-2xl font-bold text-slate-900">{riskTotal}</span>
              </div>
            </div>
          )}

          {riskTotal > 0 && (
            <div className="flex gap-4 mt-4 text-xs">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-500">{d.name}</span>
                  <span className="font-semibold text-slate-700">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader title={t("admin.dashboard.recentReports")} />

          <div className="px-5 pb-4 divide-y divide-slate-200 flex-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-3">
                  <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                </div>
              ))
            ) : (stats?.recentReports ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                {t("admin.dashboard.noRecentReports")}
              </p>
            ) : (
              stats.recentReports.map((r) => {
                const cat = categoryMeta(r.category);
                const Icon = cat.icon;

                return (
                  <div key={r.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon size={16} strokeWidth={3} className="text-slate-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-medium truncate">{r.title}</span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(r.created_at).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{r.location}</p>
                    </div>

                    <StatusBadge status={r.status} />
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
