import SectionHeader from "../common/SectionHeader";
import RainfallAlertBanner from "../components/weather/RainfallAlertBanner";
import CurrentConditions from "../components/weather/CurrentConditions";
import RainfallChart from "../components/weather/RainfallChart";
import ForecastStrip from "../components/weather/ForecastStrip";
import { rainfallAlert } from "../data/weatherData";

export default function Weather() {
  return (
    <div className="p-6 flex-1">
      <SectionHeader
        title="WEATHER FORECAST"
        subtitle="Detailed rainfall and weather forecast across North East Region"
      />

      <RainfallAlertBanner alert={rainfallAlert} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch mb-5">
        <CurrentConditions />

        <div className="lg:col-span-2">
          <RainfallChart />
        </div>
      </div>

      <ForecastStrip />
    </div>
  );
}
