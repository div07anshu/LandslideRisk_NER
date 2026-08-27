import { AlertTriangle } from "lucide-react";

import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";

import { recentAlerts, alertLevelColor } from "../../data/mockData";

function RecentAlerts() {
  return (
    <Card>
      <CardHeader title="RECENT ALERTS" actionLabel="View all" />

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
    </Card>
  );
}

export default RecentAlerts;
