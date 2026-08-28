import { ChevronRight, MapPin } from "lucide-react";
import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";
import { highRiskLocations } from "../../data/mockData";
import { Link } from "react-router-dom";

function HighRiskLocations() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader title="HIGH RISK LOCATIONS" />

      <div className="px-5 pb-2 divide-y divide-slate-300">
        {highRiskLocations.map((loc) => (
          <div
            key={loc.name}
            className="flex items-center justify-between py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <MapPin
                size={16}
                strokeWidth={3}
                className="text-red-500 shrink-0"
              />

              <div>
                <div className="text-sm font-medium">{loc.name}</div>
                <div className="text-xs text-slate-400">
                  Risk Score: {loc.score}/100
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold text-red-600 bg-red-50 rounded-full px-2.5 py-1">
              HIGH
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 pt-1 mt-auto">
        <Link to="/risk-map" className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 py-1">
          View all high risk areas
          <ChevronRight size={14} strokeWidth={3} />
        </Link>
      </div>
    </Card>
  );
}

export default HighRiskLocations;