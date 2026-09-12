import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

import Card from "../../common/Card";
import { useTranslation } from "react-i18next";

const compareColors = [
  "#3F72AF",
  "#112D4E",
  "#2563EB",
  "#16A34A",
  "#D97706",
  "#DC2626",
  "#7C3AED",
];

const TREND_RANGES = [
  { value: "24 hours", key: "24h" },
  { value: "7 days", key: "7" },
];

export default function RiskTrendChart({
  locations,
  activeIds,
  setActiveIds,
  range,
  setRange,
  chartData,
}) {
  const { t } = useTranslation();

  return (
    <Card className="p-5 h-full">
      {/* Header */}
      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          mb-4
        "
      >
        <div>
          <h3
            className="
              text-sm
              font-bold
              tracking-wide
              text-slate-900
            "
          >
            {t("riskAnalysis.title")}
          </h3>

          <p
            className="
              text-xs
              text-slate-500
              mt-1
            "
          >
            {t("riskAnalysis.subtitle")}
          </p>
        </div>

        {/* Range toggle */}
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
          {TREND_RANGES.map(({ value, key }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`
                px-2.5
                py-1
                rounded-lg
                text-xs
                font-medium
                transition
                ${
                  range === value
                    ? "bg-brand-950 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }
              `}
            >
              {t(`analysis.dateRange.${key}`, value)}
            </button>
          ))}
        </div>
      </div>

      {/* Compact selectable legend of the top monitored locations */}
      <div className="flex flex-wrap gap-2 mb-5">
        {locations.map((loc, i) => {
          const active = activeIds.includes(loc.id);

          return (
            <button
              key={loc.id}
              onClick={() =>
                setActiveIds((prev) =>
                  prev.includes(loc.id)
                    ? prev.filter((id) => id !== loc.id)
                    : [...prev, loc.id],
                )
              }
              className={`
                flex
                items-center
                gap-1.5
                px-2.5
                py-1
                rounded-lg
                text-xs
                font-medium
                border
                transition
                ${
                  active
                    ? "bg-slate-100 border-gray-300 text-slate-800"
                    : "bg-white border-transparent text-slate-400 hover:bg-slate-100"
                }
              `}
            >
              <span
                className="
                  w-2
                  h-2
                  rounded-full
                "
                style={{
                  backgroundColor: active
                    ? compareColors[i % compareColors.length]
                    : "#CBD5E1",
                }}
              />

              {loc.name}
            </button>
          );
        })}

        {locations.length === 0 && (
          <p className="text-xs text-slate-400">
            {t(
              "riskAnalysis.noComparisonData",
              "No monitored locations with history yet for this state.",
            )}
          </p>
        )}
      </div>

      {/* Chart */}
      <div
        style={{
          width: "100%",
          height: 240,
        }}
      >
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} stroke="#E2E8F0" />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 12,
                fill: "#64748B",
              }}
              axisLine={{
                stroke: "#CBD5E1",
              }}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              tick={{
                fontSize: 12,
                fill: "#64748B",
              }}
              axisLine={false}
              tickLine={false}
            />

            {/* Alert threshold */}
            <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" />

            <Tooltip
              contentStyle={{
                background: "#0B1B3B",
                border: "none",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{
                color: "#FFFFFF",
              }}
              itemStyle={{
                color: "#FFFFFF",
              }}
            />

            {activeIds.map((id) => {
              const colorIndex = locations.findIndex((l) => l.id === id);
              const loc = locations[colorIndex];
              const color = compareColors[Math.max(colorIndex, 0) % compareColors.length];

              return (
                <Line
                  key={id}
                  type="monotone"
                  connectNulls={true}
                  dataKey={id}
                  name={loc?.name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: color }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p
        className="
          text-xs
          text-slate-400
          mt-3
        "
      >
        {t("riskAnalysis.thresholdNote")}
      </p>
    </Card>
  );
}
