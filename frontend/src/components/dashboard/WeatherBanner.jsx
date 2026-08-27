import { CloudRain } from "lucide-react";

import Card from "../../common/Card";

function WeatherBanner() {
  return (
    <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
          <CloudRain size={20} strokeWidth={3} className="text-blue-500" />
        </div>

        <div>
          <h3 className="text-sm font-bold">NER Weather Summary</h3>

          <p className="text-sm text-slate-500">
            Moderate to heavy rainfall expected in Meghalaya, Mizoram and
            Arunachal Pradesh in next 24 hours.
          </p>
        </div>
      </div>

      <button className="bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg hover:bg-[#132a5c] px-4 py-2.5">
        View Detailed Forecast
      </button>
    </Card>
  );
}

export default WeatherBanner;
