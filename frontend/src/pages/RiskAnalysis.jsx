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

const API_BASE = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

// Maps the FastAPI feature payload onto the existing FactorBreakdown row shape.
const FEATURE_META = [
  { key: "rainfall_24h", label: "Rainfall · 24h (mm)", icon: CloudRain },
  { key: "rainfall_48h", label: "Rainfall · 48h (mm)", icon: CloudRain },
  { key: "rainfall_7d", label: "Rainfall · 7d (mm)", icon: CloudRain },
  { key: "average_humidity_24h", label: "Humidity · 24h avg (%)", icon: Droplets },
  { key: "soil_moisture", label: "Soil moisture (m³/m³)", icon: Waves },
  { key: "elevation", label: "Elevation (m)", icon: Mountain },
  { key: "slope", label: "Slope (°)", icon: TreePine },
];

function formatFeature(key, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  if (key === "soil_moisture") return Number(value.toFixed(3));
  if (key === "elevation") return Math.round(value);
  return Number(value.toFixed(1));
}

function errorForStatus(status) {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 400) return "Live prediction is unavailable for this location.";
  return "The risk service is temporarily unavailable. Please try again shortly.";
}

export default function RiskAnalysis() {
  const [selectedId, setSelectedId] = useState(AREAS[0].id);

  const [range, setRange] = useState("30 days");

  const [compareIds, setCompareIds] = useState([AREAS[0].id, AREAS[1].id]);

  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");
    const [riskData, setRiskData] = useState([]);

useEffect(() => {
    console.log("DATABASE DATA:", riskData);
  }, [riskData]);

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
          setPredError("Please sign in to load the live risk prediction.");
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
          setPredError(errorForStatus(res.status));
          return;
        }
        const testRes = await fetch(`${API_BASE}/api/risk/data`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const testBody = await testRes.json();

console.log("RISK DATA:", testRes.status, testBody);

if (testRes.ok) {
  setRiskData(testBody.data ?? []);
}



        const body = await res.json();
        setPrediction(body?.data ?? null);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setPrediction(null);
        setPredError("Could not reach the risk service. Please try again.");
      } finally {
        if (!controller.signal.aborted) setPredLoading(false);
      }
    }

    loadPrediction();

    return () => controller.abort();
  }, [selected.id, selected.latitude, selected.longitude]);

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
        label: meta.label,
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
          label: "Rainfall · 24h (mm)",
          value: dbRow.Rainfall,
          icon: CloudRain,
        },
        {
          key: "slope",
          label: "Slope (°)",
          value: dbRow.Slope,
          icon: TreePine,
        },
        {
          key: "elevation",
          label: "Elevation (m)",
          value: dbRow.Elevation,
          icon: Mountain,
        },
      ],
    };
  }

  // Final fallback
  return selected;
}, [prediction, riskData, selected]);

  const level =
    LEVEL_STYLES[view.riskLevel] ??
    LEVEL_STYLES[selected.riskLevel] ??
    LEVEL_STYLES.low;

  const compareData = useMemo(() => {
  const rowsByDate = {};

  riskData.forEach((row) => {
    const area = AREAS.find(
      (a) =>
        a.name === row.Location &&
        a.state === row.State,
    );

    if (!area || !compareIds.includes(area.id)) return;

    const day = new Date(row.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    if (!rowsByDate[day]) {
      rowsByDate[day] = { day };
    }

    rowsByDate[day][area.id] = Number(row.Risk_score);
  });

  return Object.values(rowsByDate);
}, [riskData, compareIds]);

  return (
    <div className="p-6 flex-1">
      {/* Header */}
      <SectionHeader
        title="RISK ANALYSIS"
        subtitle="Factor-level breakdown and score trends for monitored slopes across North East Region"
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
          {RANGE_OPTIONS.map((r) => (
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
              {r}
            </button>
          ))}
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
            Fetching live prediction…
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
            Above alert threshold
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
