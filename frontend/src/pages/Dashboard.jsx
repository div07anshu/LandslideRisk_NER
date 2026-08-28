import SectionHeader from "../common/SectionHeader";
import RiskOverview from "../components/dashboard/RiskOverview";
import ReportProblem from "../components/dashboard/ReportProblem";
import HighRiskLocations from "../components/dashboard/HighRiskLocations";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import RecentReports from "../components/dashboard/RecentReports";
import WeatherBanner from "../components/dashboard/WeatherBanner";
import QuickActions from "../components/dashboard/QuickActions";

function Dashboard() {
  return (
    <div className="p-6 flex-1">
      <SectionHeader
        title="NER RISK OVERVIEW"
        subtitle="Overall risk distribution across North East Region"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        <RiskOverview />

        <ReportProblem />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 items-stretch">
        <HighRiskLocations />

        <RecentAlerts />

        <RecentReports />
      </div>

      <WeatherBanner />

      <QuickActions />
    </div>
  );
}

export default Dashboard;
