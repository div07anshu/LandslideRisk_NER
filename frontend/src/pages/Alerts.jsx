import { useMemo, useState } from "react";
import { AlertTriangle, CloudRain, Droplets } from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import AlertsSummary from "../components/alerts/AlertsSummary";
import AlertsList from "../components/alerts/AlertsList";
import { useRiskMapData } from "../hooks/useRiskMapData";
import { useTranslation } from "react-i18next";

const LEVEL_ICONS = { high: CloudRain, moderate: Droplets, low: AlertTriangle };
const LEVEL_STATUS = { high: "ACTIVE", moderate: "MONITORING", low: "RESOLVED" };
const LEVEL_LABELS = { high: "High", moderate: "Moderate", low: "Low" };

function timeAgo(timestamp) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

// Turns a district's live risk score — the same liveRiskScores entry that
// drives its color on the Risk Map (see useRiskMapData) — into an alert
// card, so this list always matches what the map is currently showing.
function districtToAlert(feature, liveData) {
  const p = feature.properties || {};
  const name = p.dtname;
  const state = p.stname;
  const level = ["high", "moderate", "low"].includes(liveData.riskLevel)
    ? liveData.riskLevel
    : "moderate";
  const score = Math.round(Number(liveData.riskScore) || 0);

  const readings = [];
  const f = liveData.features;
  if (f && Number.isFinite(f.rainfall_24h))
    readings.push(`${f.rainfall_24h.toFixed(1)}mm rainfall (24h)`);
  if (f && Number.isFinite(f.slope))
    readings.push(`${f.slope.toFixed(0)}° slope`);

  return {
    id: `${name}-${state}`,
    title: `${LEVEL_LABELS[level]} Risk Alert - ${name}`,
    detail: readings.length
      ? `Risk score ${score}/100 — ${readings.join(", ")}. Live from the risk map.`
      : `Risk score ${score}/100. Live from the risk map.`,
    location: `${name}, ${state}`,
    level,
    score,
    time: timeAgo(liveData.timestamp),
    status: LEVEL_STATUS[level],
    icon: LEVEL_ICONS[level],
  };
}

export default function Alerts() {
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { geoData, features, liveRiskScores } = useRiskMapData();

  const alerts = useMemo(() => {
    return features
      .map((feature) => {
        const name = feature.properties?.dtname;
        const liveData = name ? liveRiskScores[name] : null;
        return liveData ? districtToAlert(feature, liveData) : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [features, liveRiskScores]);

  const loading = !geoData;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchesLevel = levelFilter === "All" || a.level === levelFilter;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q);

      return matchesLevel && matchesSearch;
    });
  }, [alerts, levelFilter, search]);

  return (
    <div className="flex-1">
      <SectionHeader
        title={t("alerts.title")}
        subtitle={t("alerts.subtitle")}
      />

      <AlertsSummary alerts={alerts} />

      <AlertsList
        alerts={filteredAlerts}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        search={search}
        setSearch={setSearch}
        loading={loading}
      />
    </div>
  );
}
