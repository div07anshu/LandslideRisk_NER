import { LEVEL_STYLES } from "../../data/analysisData";
import { useTranslation } from "react-i18next";

export default function AlertLevelBadge({ level }) {
  const { t } = useTranslation();
  const normalizedLevel = String(level || "moderate").toLowerCase();
  const style = LEVEL_STYLES[normalizedLevel] ?? LEVEL_STYLES.moderate;
  const levelLabel = t(`riskLevels.${normalizedLevel}`, level || "Moderate");

  return (
    <span
      className={`text-[11px] font-bold rounded-full px-2.5 py-1 inline-block ${style.bg} ${style.text}`}
    >
      {levelLabel} {t("common.risk")}
    </span>
  );
}