import { useMemo, useState } from "react";

import SectionHeader from "../common/SectionHeader";

import { AREAS, RANGE_OPTIONS, LEVEL_STYLES } from "../data/analysisData";

import RiskScoreCard from "../components/analysis/RiskScoreCard";
import FactorBreakdown from "../components/analysis/FactorBreakdown";
import RiskTrendChart from "../components/analysis/RiskTrendChart";
import AreaComparisonTable from "../components/analysis/AreaComparisonTable";

export default function RiskAnalysis() {
  const [selectedId, setSelectedId] = useState(AREAS[0].id);

  const [range, setRange] = useState("30 days");

  const [compareIds, setCompareIds] = useState([AREAS[0].id, AREAS[1].id]);

  const selected = useMemo(
    () => AREAS.find((a) => a.id === selectedId) ?? AREAS[0],
    [selectedId],
  );

  const level = LEVEL_STYLES[selected.riskLevel];

  const compareData = useMemo(() => {
    const days = selected.history.map((h) => h.day);

    return days.map((day, i) => {
      const row = {
        day,
      };

      compareIds.forEach((id) => {
        const area = AREAS.find((a) => a.id === id);

        row[id] = area?.history[i]?.score ?? null;
      });

      return row;
    });
  }, [compareIds, selected]);

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
                    ? "bg-[#0B1B3B] text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>

        {selected.riskLevel === "high" && (
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
        <RiskScoreCard selected={selected} level={level} />

        <div className="lg:col-span-3">
          <FactorBreakdown selected={selected} level={level} />
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
        />
      </div>
    </div>
  );
}
