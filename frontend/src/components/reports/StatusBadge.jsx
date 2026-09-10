import { STATUS_STYLES } from "../../data/reportsData";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const safeStatus = String(status || "PENDING").toUpperCase();
  const style = STATUS_STYLES[safeStatus] ?? STATUS_STYLES.PENDING;
  const statusKey = safeStatus.toLowerCase();

  return (
    <span
      className="text-[11px] font-bold rounded-full px-2.5 py-1 inline-block"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {t(`reports.status.${statusKey}`, status || "Pending")}
    </span>
  );
}