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
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

// Maps the FastAPI feature payload onto the existing FactorBreakdown row shape.
const FEATURE_META = [
  { key: "rainfall_24h", labelKey: "factors.rainfall24", icon: CloudRain },
  { key: "rainfall_48h", labelKey: "factors.rainfall48", icon: CloudRain },
  { key: "rainfall_7d", labelKey: "factors.rainfall7d", icon: CloudRain },
  { key: "average_humidity_24h", labelKey: "factors.humidity", icon: Droplets },
  { key: "soil_moisture", labelKey: "factors.soilMoisture", icon: Waves },
  { key: "elevation", labelKey: "factors.elevation", icon: Mountain },
  { key: "slope", labelKey: "factors.slope", icon: TreePine },
];

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

  const [range, setRange] = useState("30 days");

  const [compareIds, setCompareIds] = useState([AREAS[0].id, AREAS[1].id]);

  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");
  const [riskData, setRiskData] = useState([]);

  const selected = useMemo(
    () => AREAS.find((a) => a.id === selectedId) ?? AREAS[0],
    [selectedId],
  );

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

  // Live AI prediction gets priority
  if (prediction) {
    return {
      ...selected,
      riskScore: Math.round(prediction.risk_score),
      riskLevel: String(prediction.risk_level || "").toLowerCase(),
      factors: FEATURE_META.map((meta) => ({
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
          key: "rainfall_24h",
          label: t("factors.rainfall24"),
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
}, [prediction, riskData, selected, t]);

  const level =
    LEVEL_STYLES[view.riskLevel] ??
    LEVEL_STYLES[selected.riskLevel] ??
    LEVEL_STYLES.low;

  const compareData = useMemo(() => {
    // Fallback mock history generator when DB data is not yet loaded or empty
    const getMockData = () => {
      const allDays = AREAS[0]?.history?.map((h) => h.day) || [];
      const sliceCount =
        range === "7 days" ? 3 : range === "30 days" ? 5 : allDays.length;
      const targetDays = allDays.slice(-sliceCount);

      return targetDays.map((day) => {
        const point = { day };
        AREAS.forEach((area) => {
          if (compareIds.includes(area.id) && area.history) {
            const h = area.history.find((item) => item.day === day);
            if (h) {
              point[area.id] = h.score;
            }
          }
        });
        return point;
      });
    };

    if (!riskData || riskData.length === 0) {
      return getMockData();
    }

    // Parse range string like "7 days", "30 days", "90 days" to number of days
    const rangeDays = parseInt(range.split(" ")[0], 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);

    // Collect valid entries within range
    const entries = riskData
      .map((row) => {
        const rowDate = new Date(row.created_at);
        if (isNaN(rowDate.getTime()) || rowDate < cutoff) return null;

        const area = AREAS.find(
          (a) =>
            a.name === row.Location &&
            a.state === row.State,
        );

        if (!area || !compareIds.includes(area.id)) return null;

        return {
          date: rowDate,
          areaId: area.id,
          score: Number(row.Risk_score),
        };
      })
      .filter(Boolean);

    if (entries.length === 0) {
      return getMockData();
    }

    // Get unique dates sorted chronologically
    const uniqueDates = Array.from(
      new Set(entries.map((e) => e.date.toISOString().split("T")[0]))
    ).sort();

    // Build data points for each unique date
    return uniqueDates.map((dateKey) => {
      const point = {
        day: new Date(dateKey).toLocaleDateString("en-IN", {
          timeZone: "UTC",
          day: "2-digit",
          month: "short",
        })
      };

      // For each area, find the latest score on this date
      compareIds.forEach((areaId) => {
        const areaEntries = entries
          .filter((e) => e.areaId === areaId && e.date.toISOString().split("T")[0] === dateKey)
          .sort((a, b) => b.date - a.date); // latest first

        if (areaEntries.length > 0) {
          point[areaId] = areaEntries[0].score;
        }
        // else leave undefined (null) - Recharts will skip if connectNulls is true
      });

      return point;
    });
  }, [riskData, compareIds, range]);

  return (
    <div className="p-6 flex-1">
      {/* Header */}
      <SectionHeader
        title={t("analysis.title")}
        subtitle={t("analysis.subtitle")}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="
            bg-white
            border
            border-gray-300
            rounded-xl
            px-4
            py-2
            text-sm
            text-slate-700
            shadow-sm
          "
        >
          {AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.state}
            </option>
          ))}
        </select>

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
            const rawLabel = String(r).toLowerCase().replace(" days", "");
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
          compareIds={compareIds}
          setCompareIds={setCompareIds}
          compareData={compareData}
        />

        <AreaComparisonTable
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          riskData={riskData}
        />
      </div>
    </div>
  );
}