import { CloudRain } from "lucide-react";
import { Link } from "react-router-dom";

import Card from "../../common/Card";

function WeatherBanner() {
  return (
    <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <CloudRain size={20} strokeWidth={3} className="text-blue-500" />
        </div>

        <div>
          <h3 className="text-sm font-bold">NER Weather Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Check the latest rainfall and risk conditions across the region.
          </p>
        </div>
      </div>

      <Link
        to="/weather"
        className="bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg hover:bg-[#132a5c] px-4 py-2.5 shrink-0 text-center"
      >
        View Detailed Forecast
      </Link>
    </Card>
  );
}

export default WeatherBanner;