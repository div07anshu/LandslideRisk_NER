import { useEffect, useState } from "react";
import Card from "../../common/Card";

export default function FactorBreakdown({ selected, level }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="mb-5">
        <h3
          className="
            text-sm
            font-bold
            tracking-wide
            text-slate-900
          "
        >
          CONTRIBUTING FACTORS
        </h3>

        <p
          className="
            text-xs
            text-slate-500
            mt-1
          "
        >
          Factors influencing the current risk score
        </p>
      </div>

      {/* Factors */}
      <div className="space-y-4">
        {selected.factors.map((f, index) => {
          const Icon = f.icon;

          return (
            <div
              key={f.key}
              className="
                flex
                items-center
                gap-3
              "
            >
              {/* Icon */}
              <div
                className="
                  w-8
                  h-8
                  rounded-full
                  bg-slate-100
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Icon
                  className="
                    w-4
                    h-4
                    text-slate-500
                  "
                />
              </div>

              {/* Label */}
              <div className="w-32 shrink-0">
                <p
                  className="
                    text-xs
                    font-semibold
                    text-slate-700
                  "
                >
                  {f.label}
                </p>
              </div>

              {/* Progress */}
              <div
                className="
                  flex-1
                  h-2
                  bg-slate-200
                  rounded-full
                  overflow-hidden
                "
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    width: mounted ? `${f.value}%` : "0%",
                    backgroundColor: f.inverse ? "#22C55E" : level.bar,
                    transitionDelay: mounted ? `${index * 80}ms` : "0ms",
                  }}
                />
              </div>

              {/* Value */}
              <span
                className="
                  text-xs
                  font-semibold
                  text-slate-500
                  w-8
                  text-right
                "
              >
                {f.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p
        className="
          text-xs
          text-slate-400
          mt-5
        "
      >
        Vegetation cover is protective — lower bars indicate higher exposure.
      </p>
    </Card>
  );
}