import TrendIcon from "./TrendIcon";
import Card from "../../common/Card";

import { AREAS, LEVEL_STYLES } from "../../data/analysisData";

function levelLabel(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function AreaComparisonTable({ selectedId, setSelectedId }) {
  return (
    <Card className="overflow-hidden h-full">
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          px-5
          pt-4
          pb-3
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
            AREA COMPARISON
          </h3>

          <p
            className="
              text-xs
              text-slate-500
              mt-1
            "
          >
            All monitored risk areas
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="
            w-full
            text-sm
          "
        >
          <thead>
            <tr
              className="
                text-left
                text-xs
                text-slate-400
                border-y
                border-slate-200
              "
            >
              <th className="px-5 py-3 font-medium">Area</th>

              <th className="px-5 py-3 font-medium">State</th>

              <th className="px-5 py-3 font-medium">Score</th>

              <th className="px-5 py-3 font-medium">Level</th>

              <th className="px-5 py-3 font-medium">Trend</th>
            </tr>
          </thead>

          <tbody>
            {AREAS.map((a) => {
              const lv = LEVEL_STYLES[a.riskLevel];

              const selected = a.id === selectedId;

              return (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`
                    cursor-pointer
                    transition-colors
                    border-b
                    border-slate-100
                    last:border-0
                    ${selected ? "bg-slate-100" : "hover:bg-slate-50"}
                  `}
                >
                  <td
                    className="
                      px-5
                      py-3
                      font-medium
                      text-slate-800
                    "
                  >
                    {a.name}
                  </td>

                  <td
                    className="
                      px-5
                      py-3
                      text-slate-500
                    "
                  >
                    {a.state}
                  </td>

                  <td
                    className="
                      px-5
                      py-3
                      font-semibold
                      text-slate-700
                      tabular-nums
                    "
                  >
                    {a.riskScore}
                  </td>

                  <td
                    className="
                      px-5
                      py-3
                    "
                  >
                    <span
                      className={`
                        text-xs
                        font-semibold
                        px-2.5
                        py-1
                        rounded-full
                        ${lv.bg}
                        ${lv.text}
                      `}
                    >
                      {levelLabel(a.riskLevel)}
                    </span>
                  </td>

                  <td
                    className="
                      px-5
                      py-3
                      text-slate-500
                    "
                  >
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1
                        text-xs
                      "
                    >
                      <TrendIcon trend={a.trend} />

                      {a.trend === "up"
                        ? "Rising"
                        : a.trend === "down"
                          ? "Falling"
                          : "Stable"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
