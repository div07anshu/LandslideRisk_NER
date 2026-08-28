import { STATUS_STYLES } from "../../data/reportsData";

function statusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  return (
    <span
      className="text-[11px] font-bold rounded-full px-2.5 py-1 inline-block"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {statusLabel(status)}
    </span>
  );
}