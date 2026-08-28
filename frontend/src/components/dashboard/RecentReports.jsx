import { ChevronRight } from "lucide-react";
import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";
import { recentReports } from "../../data/mockData";
import { Link } from "react-router-dom";

function RecentReports() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader title="RECENT REPORTS" />

      <div className="px-5 pb-4 divide-y divide-slate-300">
        {recentReports.map((r) => (
          <div key={r.title} className="flex items-center gap-3 py-2.5">
            <div className="w-14 h-11 rounded-lg bg-slate-200 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {r.title}
                </span>

                <span className="text-[11px] text-slate-400">{r.time}</span>
              </div>

              <p className="text-xs text-slate-500 truncate">{r.detail}</p>

              <span
                className="text-[10px] font-bold rounded-full px-2 py-0.5 inline-block mt-1"
                style={{
                  color: r.statusColor,
                  backgroundColor: r.statusBg,
                }}
              >
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 pt-1 mt-auto">
        <Link to="/reports" className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 py-1">
          View all reports
          <ChevronRight size={14} strokeWidth={3} />
        </Link>
      </div>
    </Card>
  );
}

export default RecentReports;