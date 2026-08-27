import { useEffect, useState } from "react";
import Card from "../../common/Card";
import DonutChart from "./DonutChart";

import { riskSummary, totalAreas } from "../../data/mockData";

function RiskOverview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const donutData = riskSummary.map((r) => ({
    name: r.label,
    value: r.count,
    color: r.accent,
  }));

  return (
    <Card className="lg:col-span-3 p-6 flex flex-col sm:flex-row items-center gap-8">
      <div className="relative w-32 h-32 shrink-0">
        <DonutChart data={donutData} size={128} thickness={20} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-400">Total Areas</span>
          <span className="text-2xl font-bold text-slate-900">
            {totalAreas}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 w-full">
        {riskSummary.map((r, index) => (
          <div key={r.label}>
            <div
              className="text-xs font-bold tracking-wide"
              style={{ color: r.accent }}
            >
              {r.label}
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {r.percent}%
            </div>
            <div className="text-sm text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{r.count}</span>{" "}
              Areas
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: r.accent }}
              />
              {r.status}
            </div>
            <div
              className="h-1.5 rounded-full mt-3"
              style={{ backgroundColor: r.barBg }}
            >
              <div
                className="h-1.5 rounded-full transition-all ease-out motion-reduce:transition-none"
                style={{
                  width: mounted ? `${r.percent}%` : "0%",
                  backgroundColor: r.accent,
                  transitionDuration: "800ms",
                  transitionDelay: `${index * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default RiskOverview;