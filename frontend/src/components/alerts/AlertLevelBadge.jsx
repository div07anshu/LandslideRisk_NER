import { LEVEL_STYLES } from "../../data/analysisData";

function levelLabel(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function AlertLevelBadge({ level }) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.moderate;

  return (
    <span
      className={`text-[11px] font-bold rounded-full px-2.5 py-1 inline-block ${style.bg} ${style.text}`}
    >
      {levelLabel(level)} risk
    </span>
  );
}
