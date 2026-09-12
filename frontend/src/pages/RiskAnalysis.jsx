import { useEffect, useMemo, useState } from "react";
import {
  CloudRain,
  Droplets,
  Mountain,
  Waves,
  TreePine,
} from "lucide-react";

import SectionHeader from "../common/SectionHeader";
import { supabase } from "../supabase";

import { AREAS, RANGE_OPTIONS, LEVEL_STYLES } from "../data/analysisData";

import RiskScoreCard from "../components/analysis/RiskScoreCard";
import FactorBreakdown from "../components/analysis/FactorBreakdown";
import RiskTrendChart from "../components/analysis/RiskTrendChart";
import AreaComparisonTable from "../components/analysis/AreaComparisonTable";
import LocationSearchFilter from "../components/analysis/LocationSearchFilter";
import { useTranslation } from "react-i18next";

// Maps a row from the Supabase `location` table onto the shape the analysis
// UI expects (RiskScoreCard/FactorBreakdown read name/state/riskScore/factors).
function locationToArea(row) {
  return {
    id: String(row.id),
    name: row.City,
    state: row.State,
    district: row.District,
    latitude: row.Latitude,
    longitude: row.Longitude,
    riskScore: 0,
    riskLevel: "low",
    trend: "flat",
    factors: [],
    history: [],
  };
}

const API_BASE = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

// Maps the FastAPI feature payload onto the existing FactorBreakdown row shape.
// The rainfall row swaps to match the selected trend range.
function getFeatureMeta(range) {
  const rainfall =
    range === "24 hours"
      ? { key: "rainfall_24h", labelKey: "factors.rainfall24" }
      : range === "48 hours"
        ? { key: "rainfall_48h", labelKey: "factors.rainfall48" }
        : { key: "rainfall_7d", labelKey: "factors.rainfall7d" };

  return [
    { ...rainfall, icon: CloudRain },
    { key: "average_humidity_24h", labelKey: "factors.humidity", icon: Droplets },
    { key: "soil_moisture", labelKey: "factors.soilMoisture", icon: Waves },
    { key: "elevation", labelKey: "factors.elevation", icon: Mountain },
    { key: "slope", labelKey: "factors.slope", icon: TreePine },
  ];
}

function formatFeature(key, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  if (key === "soil_moisture") return Number(value.toFixed(3));
  if (key === "elevation") return Math.round(value);
  return Number(value.toFixed(1));
}

function errorForStatus(status, t) {
  if (status === 401) return t("analysis.errorUnauthorized");
  if (status === 400) return t("analysis.errorUnavailable");
  return t("analysis.errorService");
}

export default function RiskAnalysis() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(AREAS[0].id);

  const [range, setRange] = useState("7 days");

  const [compareRange, setCompareRange] = useState("7 days");
  const [activeCompareIds, setActiveCompareIds] = useState([]);

  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");
  const [riskData, setRiskData] = useState([]);
  const [locations, setLocations] = useState([]);

  // Fetch the state/district/city reference list from Supabase (via the
  // backend) to populate the location search filter.
  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/risk/locations`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) return;

        const body = await res.json();
        const rows = Array.isArray(body?.data) ? body.data : [];
        if (rows.length > 0) {
          const mapped = rows.map(locationToArea);
          setLocations(mapped);
          setSelectedId((current) =>
            current === AREAS[0].id ? mapped[0].id : current,
          );
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          // Search filter falls back to the local AREAS list on failure.
        }
      }
    }

    loadLocations();

    return () => controller.abort();
  }, []);

  const searchAreas = locations.length > 0 ? locations : AREAS;

  const selected = useMemo(
    () =>
      searchAreas.find((a) => a.id === selectedId) ??
      AREAS.find((a) => a.id === selectedId) ??
      searchAreas[0],
    [searchAreas, selectedId],
  );

  // The top-7 highest-risk *monitored* locations in the selected area's
  // state — i.e. locations that actually have real risk_data history,
  // ranked by their latest risk_score. Feeds the Area Comparison table.
  const stateMonitoredLocations = useMemo(() => {
    const byName = new Map();

    riskData.forEach((row) => {
      if (row.State !== selected.state) return;
      if (!byName.has(row.Location)) byName.set(row.Location, []);
      byName.get(row.Location).push(row);
    });

    const list = Array.from(byName.entries()).map(([name, rows]) => {
      const sorted = [...rows].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      const latest = sorted[sorted.length - 1];
      const match = searchAreas.find(
        (a) => a.name === name && a.state === selected.state,
      );

      return {
        id: match ? match.id : name,
        name,
        state: selected.state,
        latestScore: Number(latest.Risk_score),
        history: sorted.map((row) => ({
          timestamp: new Date(row.created_at),
          score: Number(row.Risk_score),
        })),
      };
    });

    list.sort((a, b) => b.latestScore - a.latestScore);

    return list.slice(0, 7);
  }, [riskData, selected.state, searchAreas]);

  // The original 5 monitored locations — these are the ones with real,
  // substantial risk_data history. Feeds the Risk Trend chart. Each one's
  // trend is built purely from its actual historical records; nothing here
  // is fabricated.
  const trendLocations = useMemo(() => {
    return AREAS.map((area) => {
      const rows = riskData.filter(
        (row) => row.Location === area.name && row.State === area.state,
      );
      const sorted = [...rows].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      const latest = sorted[sorted.length - 1];

      return {
        id: area.id,
        name: area.name,
        state: area.state,
        latestScore: latest ? Number(latest.Risk_score) : area.riskScore ?? 0,
        history: sorted.map((row) => ({
          timestamp: new Date(row.created_at),
          score: Number(row.Risk_score),
        })),
      };
    });
  }, [riskData]);

  // Default to the top 3 by latest score for readability; the other 2 are
  // toggleable via the legend.
  useEffect(() => {
    const byScore = [...trendLocations].sort((a, b) => b.latestScore - a.latestScore);
    setActiveCompareIds(byScore.slice(0, 3).map((l) => l.id));
  }, [trendLocations]);

  // Buckets each active location's real historical records into either
  // hourly (24h view) or daily (7d view) points, labeled with actual
  // timestamps/dates from the data — never fabricated.
  const trendChartData = useMemo(() => {
    const cutoff = new Date();
    if (compareRange === "24 hours") cutoff.setHours(cutoff.getHours() - 24);
    else cutoff.setDate(cutoff.getDate() - 7);

    const bucketKey = (date) =>
      compareRange === "24 hours"
        ? new Date(date).setMinutes(0, 0, 0)
        : new Date(date).setHours(0, 0, 0, 0);

    const bucketLabel = (ms) => {
      const d = new Date(ms);
      return compareRange === "24 hours"
        ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
        : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    };

    const buckets = new Map();

    trendLocations.forEach((loc) => {
      if (!activeCompareIds.includes(loc.id)) return;

      loc.history
        .filter((h) => h.timestamp >= cutoff)
        .forEach((h) => {
          const key = bucketKey(h.timestamp);
          if (!buckets.has(key)) buckets.set(key, { key, label: bucketLabel(key) });
          buckets.get(key)[loc.id] = h.score;
        });
    });

    return Array.from(buckets.values()).sort((a, b) => a.key - b.key);
  }, [trendLocations, activeCompareIds, compareRange]);

  // Fetch the real ML prediction for the selected area from the Node backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadPrediction() {
      setPredLoading(true);
      setPredError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          setPrediction(null);
          setPredError(t("analysis.errorUnauthorized"));
          return;
        }

        const res = await fetch(`${API_BASE}/api/risk/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: selected.latitude,
            longitude: selected.longitude,
            location: selected.name,
            state: selected.state,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          setPrediction(null);
          setPredError(errorForStatus(res.status, t));
          return;
        }

        const body = await res.json();
        setPrediction(body?.data ?? null);

        // Fetch historical risk data for trend charts
        const historyRes = await fetch(`${API_BASE}/api/risk/data`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (historyRes.ok) {
          const historyBody = await historyRes.json();
          setRiskData(historyBody.data ?? []);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        setPrediction(null);
        setPredError(t("analysis.errorService"));
      } finally {
        if (!controller.signal.aborted) setPredLoading(false);
      }
    }

    loadPrediction();

    return () => controller.abort();
  }, [selected.id, selected.latitude, selected.longitude, selected.name, selected.state, t]);

  // Overlay the real prediction onto the selected area for the score/factor UI.
  const view = useMemo(() => {
  const dbRow = riskData.find(
    (row) =>
      row.Location === selected.name &&
      row.State === selected.state,
  );

  const featureMeta = getFeatureMeta(range);

  // Live AI prediction gets priority
  if (prediction) {
    return {
      ...selected,
      riskScore: Math.round(prediction.risk_score),
      riskLevel: String(prediction.risk_level || "").toLowerCase(),
      factors: featureMeta.map((meta) => ({
        key: meta.key,
        label: t(meta.labelKey),
        value: formatFeature(
          meta.key,
          prediction.features?.[meta.key],
        ),
        icon: meta.icon,
      })),
    };
  }

  // If there is no live prediction, use Supabase data
  if (dbRow) {
    return {
      ...selected,
      riskScore: Math.round(dbRow.Risk_score),
      riskLevel: String(dbRow.Risk_level || "").toLowerCase(),
      factors: [
        {
          key: featureMeta[0].key,
          label: t(featureMeta[0].labelKey),
          value: dbRow.Rainfall,
          icon: CloudRain,
        },
        {
          key: "slope",
          label: t("factors.slope"),
          value: dbRow.Slope,
          icon: TreePine,
        },
        {
          key: "elevation",
          label: t("factors.elevation"),
          value: dbRow.Elevation,
          icon: Mountain,
        },
      ],
    };
  }

  // Final fallback
  return selected;
}, [prediction, riskData, selected, range, t]);

  const level =
    LEVEL_STYLES[view.riskLevel] ??
    LEVEL_STYLES[selected.riskLevel] ??
    LEVEL_STYLES.low;

  return (
    <div className="flex-1">
      {/* Header */}
      <SectionHeader
        title={t("analysis.title")}
        subtitle={t("analysis.subtitle")}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <LocationSearchFilter
          areas={searchAreas}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />

        <div
          className="
            flex
            bg-white
            border
            border-gray-300
            rounded-xl
            p-1
            shadow-sm
          "
        >
          {RANGE_OPTIONS.map((r) => {
            const rawLabel = String(r).toLowerCase().replace(" days", "").replace(" hours", "h");
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`
                  px-3
                  py-1.5
                  rounded-lg
                  text-xs
                  font-medium
                  transition
                  ${
                    range === r
                      ? "bg-brand-950 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }
                `}
              >
                {t(`analysis.dateRange.${rawLabel}`, t(`riskAnalysis.range${rawLabel}days`, r))}
              </button>
            )
          })}
        </div>

        {predLoading && (
          <div
            className="
              ml-auto
              text-xs
              font-medium
              text-slate-600
              bg-slate-50
              border
              border-slate-200
              px-3
              py-2
              rounded-xl
            "
          >
            {t("analysis.fetchingPrediction")}
          </div>
        )}

        {!predLoading && predError && (
          <div
            className="
              ml-auto
              text-xs
              font-medium
              text-red-600
              bg-red-50
              border
              border-red-100
              px-3
              py-2
              rounded-xl
            "
          >
            {predError}
          </div>
        )}

        {!predLoading && !predError && view.riskLevel === "high" && (
          <div
            className="
              ml-auto
              text-xs
              font-medium
              text-red-600
              bg-red-50
              border
              border-red-100
              px-3
              py-2
              rounded-xl
            "
          >
            {t("analysis.aboveThreshold")}
          </div>
        )}
      </div>

      {/* Score + Factors */}
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-4
          gap-4
          mb-5
        "
      >
        <RiskScoreCard selected={view} level={level} />

        <div className="lg:col-span-3">
          <FactorBreakdown selected={view} level={level} />
        </div>
      </div>

      {/* Trend + Comparison */}
      <div
        className="
    grid
    grid-cols-1
    lg:grid-cols-2
    gap-5
    items-stretch
    mb-5
  "
      >
        <RiskTrendChart
          locations={trendLocations}
          activeIds={activeCompareIds}
          setActiveIds={setActiveCompareIds}
          range={compareRange}
          setRange={setCompareRange}
          chartData={trendChartData}
        />

        <AreaComparisonTable
          areas={stateMonitoredLocations}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          riskData={riskData}
        />
      </div>
    </div>
  );
}