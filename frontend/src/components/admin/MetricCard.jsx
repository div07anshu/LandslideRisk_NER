import Card from "../../common/Card";

function MetricCard({ label, value, icon: Icon, accent = "#1D4ED8", loading = false }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        {Icon && <Icon size={20} strokeWidth={2.5} />}
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500 truncate">{label}</div>
        {loading ? (
          <div className="h-6 w-14 mt-1 rounded bg-slate-200 animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{value}</div>
        )}
      </div>
    </Card>
  );
}

export default MetricCard;
