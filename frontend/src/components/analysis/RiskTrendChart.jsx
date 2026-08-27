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

import { AREAS } from "../../data/analysisData";

import Card from "../../common/Card";

const compareColors = ["#3F72AF", "#112D4E", "#2563EB", "#16A34A"];

export default function RiskTrendChart({
  compareIds,
  setCompareIds,
  compareData,
}) {
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
          mb-5
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
            RISK SCORE TREND
          </h3>

          <p
            className="
              text-xs
              text-slate-500
              mt-1
            "
          >
            Historical risk movement across monitored areas
          </p>
        </div>

        {/* Area toggles */}
        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          {AREAS.map((a) => {
            const active = compareIds.includes(a.id);

            return (
              <button
                key={a.id}
                onClick={() =>
                  setCompareIds((prev) =>
                    prev.includes(a.id)
                      ? prev.filter((id) => id !== a.id)
                      : prev.length < 4
                        ? [...prev, a.id]
                        : prev,
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
                      ? compareColors[
                          compareIds.indexOf(a.id) % compareColors.length
                        ]
                      : "#CBD5E1",
                  }}
                />

                {a.name}
              </button>
            );
          })}
        </div>
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
            data={compareData}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} stroke="#E2E8F0" />

            <XAxis
              dataKey="day"
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

            {compareIds.map((id, i) => {
              const area = AREAS.find((a) => a.id === id);

              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={area?.name}
                  stroke={compareColors[i % compareColors.length]}
                  strokeWidth={2.5}
                  dot={false}
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
        Dashed line represents the alert threshold (70).
      </p>
    </Card>
  );
}
