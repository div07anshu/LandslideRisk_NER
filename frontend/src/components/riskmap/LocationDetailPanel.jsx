import {
  X,
  MapPin,
  Calendar,
  Activity,
  Navigation,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Users,
  Route,
  School,
  Hospital,
} from "lucide-react";

import { Link } from "react-router-dom";
import Card from "../../common/Card";
import TrendIcon from "../analysis/TrendIcon";
import { LEVEL_STYLES } from "../../data/analysisData";
import { useTranslation } from "react-i18next";

export default function LocationDetailPanel({
  selected,
  onClose,
  onRefresh,
}) {
  const { t } = useTranslation();

  if (!selected) return null;

  /* -------------------------------------------------------
     INCIDENT
  ------------------------------------------------------- */

  if (selected.type === "incident") {
    return (
      <div className="h-full w-full">
        <Card
          className="
            h-full
            flex flex-col
            overflow-hidden
            rounded-2xl
            border border-white/80
            bg-white/95
            backdrop-blur-xl
            shadow-[0_20px_60px_rgba(15,23,42,0.22)]
          "
        >
          {/* HEADER */}

          <div className="
            px-5 py-4
            border-b border-slate-100
            bg-gradient-to-r
            from-red-50
            to-white
          ">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  bg-red-100
                  text-red-700
                  px-2
                  py-1
                  rounded-md
                  mb-2
                ">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Live Incident
                </div>

                <h3 className="
                  text-base
                  font-bold
                  text-slate-900
                  leading-tight
                ">
                  {selected.category ||
                    "Landslide Event"}
                </h3>

                <p className="
                  text-xs
                  text-slate-400
                  mt-1
                  truncate
                ">
                  {selected.district
                    ? `${selected.district}, `
                    : ""}
                  {selected.state}
                </p>
              </div>

              <button
                onClick={onClose}
                className="
                  shrink-0
                  w-8 h-8
                  rounded-xl
                  bg-white
                  border border-slate-200
                  flex items-center justify-center
                  text-slate-400
                  hover:text-slate-700
                  hover:bg-slate-50
                  transition-colors
                "
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* CONTENT */}

          <div className="flex-1 overflow-y-auto p-5">
            <div className="
              rounded-2xl
              bg-red-50
              border border-red-100
              p-4
            ">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle
                  size={16}
                  className="text-red-600"
                />

                <span className="
                  text-[10px]
                  uppercase
                  tracking-widest
                  font-bold
                  text-red-500
                ">
                  Active Report
                </span>
              </div>

              <h4 className="
                text-sm
                font-bold
                text-slate-900
              ">
                {selected.title ||
                  "Reported Incident"}
              </h4>

              {selected.detail && (
                <p className="
                  text-xs
                  text-slate-500
                  mt-2
                  leading-relaxed
                ">
                  {selected.detail}
                </p>
              )}
            </div>

            {/* DATE */}

            <div className="
              mt-3
              flex items-center gap-3
              rounded-xl
              border border-slate-100
              bg-slate-50
              p-3
            ">
              <div className="
                w-8 h-8
                rounded-lg
                bg-white
                flex items-center justify-center
                text-slate-400
              ">
                <Calendar size={15} />
              </div>

              <div>
                <div className="
                  text-[9px]
                  uppercase
                  tracking-wider
                  font-bold
                  text-slate-400
                ">
                  Reported
                </div>

                <div className="
                  text-xs
                  font-semibold
                  text-slate-700
                  mt-0.5
                ">
                  {selected.date?.split(
                    " "
                  )[0] || "Unknown"}
                </div>
              </div>
            </div>

            {/* COORDINATES */}

            <div className="
              mt-3
              rounded-xl
              border border-slate-100
              bg-slate-50
              p-3
            ">
              <div className="flex items-center gap-2 mb-2">
                <Navigation
                  size={14}
                  className="text-slate-400"
                />

                <span className="
                  text-[9px]
                  uppercase
                  tracking-wider
                  font-bold
                  text-slate-400
                ">
                  Coordinates
                </span>
              </div>

              <div className="
                font-mono
                text-xs
                text-slate-700
              ">
                {selected.lat?.toFixed(
                  5
                )}
                ° N
                <span className="mx-2 text-slate-300">
                  /
                </span>
                {selected.lng?.toFixed(
                  5
                )}
                ° E
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="
            p-4
            border-t border-slate-100
          ">
            <Link
              to="/reports"
              className="
                w-full
                flex
                items-center
                justify-center
                gap-2
                bg-brand-950
                text-white
                text-xs
                font-semibold
                rounded-xl
                py-3
                hover:bg-brand-800
                transition-colors
                shadow-sm
              "
            >
              View Field Reports
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  /* -------------------------------------------------------
     DISTRICT / SENSOR
  ------------------------------------------------------- */

  const levelKey =
    (
      selected.riskLevel ||
      "low"
    ).toLowerCase();

  const level =
    LEVEL_STYLES[levelKey] ||
    LEVEL_STYLES.low;

  return (
    <div className="h-full w-full">
      <Card
        className="
          h-full
          flex flex-col
          overflow-hidden
          rounded-2xl
          border border-white/80
          bg-white/95
          backdrop-blur-xl
          shadow-[0_20px_60px_rgba(15,23,42,0.22)]
        "
      >
        {/* HEADER */}

        <div className="
          px-5 py-4
          border-b border-slate-100
        ">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {selected.isDistrict ? (
                <div className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  bg-blue-50
                  text-blue-600
                  px-2
                  py-1
                  rounded-md
                  mb-2
                ">
                  <MapPin size={10} />
                  District Boundary
                </div>
              ) : (
                <div className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  bg-slate-100
                  text-slate-600
                  px-2
                  py-1
                  rounded-md
                  mb-2
                ">
                  <Activity size={10} />
                  Sensor Station
                </div>
              )}

              <h3 className="
                text-base
                font-bold
                text-slate-900
                truncate
              ">
                {selected.name}
              </h3>

              <p className="
                text-xs
                text-slate-400
                mt-1
              ">
                {selected.state}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onRefresh && selected.isDistrict && !selected.loading && (
                <button
                  onClick={() => onRefresh(selected.name)}
                  className="
                    w-8 h-8
                    rounded-xl
                    bg-blue-50
                    border border-blue-200
                    flex items-center justify-center
                    text-blue-600
                    hover:text-blue-700
                    hover:bg-blue-100
                    transition-colors
                  "
                  title="Refresh data"
                >
                  <RefreshCw size={13} />
                </button>
              )}

              <button
                onClick={onClose}
                className="
                  w-8 h-8
                  rounded-xl
                  bg-slate-50
                  border border-slate-200
                  flex items-center justify-center
                  text-slate-400
                  hover:text-slate-700
                  hover:bg-slate-100
                  transition-colors
                "
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto p-5">
          {/* SCORE */}

          <div className="
            rounded-2xl
            bg-slate-50
            border border-slate-100
            p-4
          ">
            <div className="
              flex
              items-end
              justify-between
            ">
              <div>
                <div className="
                  text-[9px]
                  uppercase
                  tracking-widest
                  font-bold
                  text-slate-400
                  mb-1
                ">
                  Current Risk Score
                </div>

                <div className="
                  flex
                  items-baseline
                  gap-1
                ">
                  <span className="
                    text-5xl
                    font-bold
                    text-slate-900
                    tabular-nums
                  ">
                    {selected.loading ? (
                      <span className="text-3xl text-slate-400">Loading...</span>
                    ) : (
                      selected.riskScore
                    )}
                  </span>

                  {!selected.loading && (
                    <span className="
                      text-sm
                      text-slate-400
                    ">
                      /100
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`
                  w-12 h-12
                  rounded-2xl
                  flex items-center justify-center
                  ${level.bg}
                  ${level.text}
                `}
              >
                <BarChart3 size={21} />
              </div>
            </div>

            <div
              className={`
                inline-flex
                items-center
                gap-1.5
                mt-3
                text-xs
                font-semibold
                px-3
                py-1.5
                rounded-full
                ${level.bg}
                ${level.text}
              `}
            >
              {selected.trend && (
                <TrendIcon
                  trend={
                    selected.trend
                  }
                />
              )}

              <span>
                {t(
                  `riskLevels.${levelKey}`,
                  selected.riskLevel ||
                  "Low"
                )}{" "}
                Risk
              </span>
            </div>
          </div>

          {/* HISTORICAL EVENTS */}

          {selected.incidents !==
            undefined && (
              <div className="
              mt-3
              flex
              items-center
              justify-between
              rounded-xl
              border border-slate-100
              bg-white
              p-3
            ">
                <span className="
                text-xs
                text-slate-500
              ">
                  Historical Events
                </span>

                <span className="
                text-sm
                font-bold
                text-slate-800
              ">
                  {selected.incidents}
                </span>
              </div>
            )}

          {/* DISTRICT DETAILS */}
          {selected.details && (
            <div className="mt-3">
              <div className="
                text-[9px]
                uppercase
                tracking-widest
                font-bold
                text-slate-400
                mb-3
              ">
                District Details
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selected.details.Population != null && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users size={12} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">
                        Population
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                      {Number(selected.details.Population).toLocaleString()}
                    </div>
                  </div>
                )}

                {selected.details["National Highways"] && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Route size={12} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">
                        National Highways
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-900">
                      {selected.details["National Highways"]}
                    </div>
                  </div>
                )}

                {selected.details["Government Schools"] != null && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <School size={12} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">
                        Govt. Schools
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                      {selected.details["Government Schools"]}
                    </div>
                  </div>
                )}

                {selected.details["Government Hospitals"] != null && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Hospital size={12} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">
                        Govt. Hospitals
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                      {selected.details["Government Hospitals"]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {selected.error && (
            <div className="
              mt-3
              rounded-xl
              bg-amber-50
              border border-amber-200
              p-3
            ">
              <div className="text-xs text-amber-700">
                ⚠️ {selected.error}
              </div>
            </div>
          )}

          {/* PROBABILITY */}
          {selected.probability !== undefined && !selected.loading && (
            <div className="
              mt-3
              flex
              items-center
              justify-between
              rounded-xl
              border border-slate-100
              bg-white
              p-3
            ">
              <span className="
                text-xs
                text-slate-500
              ">
                Landslide Probability
              </span>

              <span className="
                text-sm
                font-bold
                text-slate-800
              ">
                {(selected.probability * 100).toFixed(2)}%
              </span>
            </div>
          )}

          {/* FACTORS */}

          {selected.factors && !selected.loading && (
            <div className="mt-5">
              <div className="
                text-[9px]
                uppercase
                tracking-widest
                font-bold
                text-slate-400
                mb-3
              ">
                Live Environmental Data
              </div>

              <div className="space-y-2">
                {selected.factors.map((factor) => (
                  <div
                    key={factor.key}
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-lg
                      border border-slate-100
                      bg-slate-50
                      px-3
                      py-2
                    "
                  >
                    <span className="
                      text-xs
                      text-slate-600
                    ">
                      {factor.labelKey
                        ? t(
                          factor.labelKey,
                          factor.label
                        )
                        : t(
                          `factors.${factor.key}`,
                          factor.label
                        )}
                    </span>

                    <span className="
                      text-xs
                      font-bold
                      text-slate-900
                      tabular-nums
                    ">
                      {factor.value}
                      {factor.unit && (
                        <span className="text-slate-400 ml-0.5 font-normal">
                          {factor.unit}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {selected.loading && (
            <div className="mt-5">
              <div className="
                text-[9px]
                uppercase
                tracking-widest
                font-bold
                text-slate-400
                mb-3
              ">
                Loading Environmental Data...
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="
                      h-9
                      rounded-lg
                      bg-slate-100
                      animate-pulse
                    "
                  />
                ))}
              </div>
            </div>
          )}

          {/* SENSOR INFO */}

          {!selected.isDistrict &&
            selected.lat &&
            selected.lng && (
              <div className="
                mt-5
                rounded-xl
                bg-slate-50
                border border-slate-100
                p-3
              ">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation
                    size={13}
                    className="text-slate-400"
                  />

                  <span className="
                    text-[9px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-slate-400
                  ">
                    Station Coordinates
                  </span>
                </div>

                <span className="
                  font-mono
                  text-[11px]
                  text-slate-700
                ">
                  {selected.lat?.toFixed(
                    4
                  )}
                  ° N,{" "}
                  {selected.lng?.toFixed(
                    4
                  )}
                  ° E
                </span>
              </div>
            )}
        </div>

        {/* FOOTER */}

        <div className="
          p-4
          border-t border-slate-100
        ">
          <Link
            to="/risk-analysis"
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              bg-brand-950
              text-white
              text-xs
              font-semibold
              rounded-xl
              py-3
              hover:bg-brand-800
              transition-colors
              shadow-sm
            "
          >
            View Full Analysis
          </Link>
        </div>
      </Card>
    </div>
  );
}