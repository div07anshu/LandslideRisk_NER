import Card from "../../common/Card";

import ContourMotif from "./ContourMotif";
import TrendIcon from "./TrendIcon";

function levelLabel(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function RiskScoreCard({ selected, level }) {
  return (
    <Card
      className="
        relative
        overflow-hidden
        bg-white
        rounded-3xl
        border
        border-gray-300
        shadow
        p-5
        flex
        flex-col
        justify-between
        min-h-[220px]
      "
    >
      <style>{`
        @keyframes scoreCardIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .score-card-content {
          animation: scoreCardIn 350ms ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .score-card-content { animation: none; }
        }
      `}</style>

      <ContourMotif
        className={`
          absolute
          -bottom-5
          -right-5
          w-48
          h-32
          ${level.text}
          opacity-20
        `}
      />

      <div key={selected.id} className="relative score-card-content">
        <p
          className="
            text-xs
            font-bold
            tracking-wide
            text-slate-500
          "
        >
          COMPOSITE RISK SCORE
        </p>

        <div className="flex items-baseline gap-2 mt-2">
          <span
            className="
              text-5xl
              font-bold
              text-slate-900
              tabular-nums
            "
          >
            {selected.riskScore}
          </span>

          <span
            className="
              text-sm
              text-slate-400
            "
          >
            / 100
          </span>
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
            py-1
            rounded-full
            ${level.bg}
            ${level.text}
          `}
        >
          <TrendIcon trend={selected.trend} />
          {levelLabel(selected.riskLevel)} risk
        </div>
      </div>

      <div
        key={`${selected.id}-meta`}
        className="relative mt-6 score-card-content"
      >
        <p
          className="
            text-sm
            font-semibold
            text-slate-700
          "
        >
          {selected.name}
        </p>

        <p
          className="
            text-xs
            text-slate-400
            mt-0.5
          "
        >
          {selected.state}
        </p>
      </div>
    </Card>
  );
}