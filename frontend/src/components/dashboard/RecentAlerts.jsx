import { AlertTriangle, ChevronRight } from "lucide-react";
import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";
import { recentAlerts, alertLevelColor } from "../../data/mockData";
import { Link } from "react-router-dom";

function RecentAlerts() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader title="RECENT ALERTS" />

      <div className="px-5 pb-4 space-y-4">
        {recentAlerts.map((a) => (
          <div key={a.title} className="flex gap-3">
            <AlertTriangle
              size={16}
              strokeWidth={3}
              className="mt-0.5 shrink-0"
              style={{
                color: alertLevelColor[a.level],
              }}
            />

            <div>
              <span
                className="text-sm font-semibold"
                style={{
                  color: alertLevelColor[a.level],
                }}
              >
                {a.title}
              </span>

              <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>

              <span
                className="text-[11px] font-medium mt-1 inline-block"
                style={{
                  color: alertLevelColor[a.level],
                }}
              >
                {a.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 pt-1 mt-auto">
        <Link to="/alerts" className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 py-1">
          View all alerts
          <ChevronRight size={14} strokeWidth={3} />
        </Link>
      </div>
    </Card>
  );
}

export default RecentAlerts;