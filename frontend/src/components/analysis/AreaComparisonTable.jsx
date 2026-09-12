import TrendIcon from "./TrendIcon";
import Card from "../../common/Card";

import { AREAS, LEVEL_STYLES } from "../../data/analysisData";
import { useTranslation } from "react-i18next";

export default function AreaComparisonTable({
  selectedId,
  setSelectedId,
  riskData,
}) {
  const { t } = useTranslation();

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
            {t("areaComparison.title")}
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
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
              <th className="px-5 py-3 font-medium">{t("areaComparison.area")}</th>
              <th className="px-5 py-3 font-medium">{t("areaComparison.state")}</th>
              <th className="px-5 py-3 font-medium">{t("areaComparison.riskScore")}</th>
              <th className="px-5 py-3 font-medium">{t("areaComparison.riskLevel")}</th>
              <th className="px-5 py-3 font-medium">{t("riskAnalysis.riskTrend")}</th>
            </tr>
          </thead>

          <tbody>
            {AREAS.map((a) => {
              // Get all database records for this area
              const areaRows = riskData
                .filter(
                  (row) =>
                    row.Location === a.name &&
                    row.State === a.state,
                )
                .sort(
                  (x, y) =>
                    new Date(y.created_at) -
                    new Date(x.created_at),
                );

              // Newest and previous database records
              const latest = areaRows[0];
              const previous = areaRows[1];

              // Use database score if available,
              // otherwise use the existing AREAS value
              const riskScore = latest
                ? Number(latest.Risk_score)
                : a.riskScore;

              // Use database level if available
              const riskLevel = latest
                ? String(latest.Risk_level || "").toLowerCase()
                : a.riskLevel;

              // Calculate trend using the two newest records
              let trend = "flat";

              if (latest && previous) {
                if (
                  Number(latest.Risk_score) >
                  Number(previous.Risk_score)
                ) {
                  trend = "up";
                } else if (
                  Number(latest.Risk_score) <
                  Number(previous.Risk_score)
                ) {
                  trend = "down";
                }
              }

              const lv = LEVEL_STYLES[riskLevel] || LEVEL_STYLES.low;
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
                  {/* Area */}
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

                  {/* State */}
                  <td
                    className="
                      px-5
                      py-3
                      text-slate-500
                    "
                  >
                    {a.state}
                  </td>

                  {/* Score */}
                  <td
                    className="
                      px-5
                      py-3
                      font-semibold
                      text-slate-700
                      tabular-nums
                    "
                  >
                    {riskScore}
                  </td>

                  {/* Level */}
                  <td className="px-5 py-3">
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
                      {t(`riskLevels.${(riskLevel || "low").toLowerCase()}`, riskLevel || "Low")}
                    </span>
                  </td>

                  {/* Trend */}
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
                      <TrendIcon trend={trend} />

                      {trend === "up"
                        ? "↑"
                        : trend === "down"
                          ? "↓"
                          : "→"}
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