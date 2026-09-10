import SectionHeader from "../common/SectionHeader";
import RiskOverview from "../components/dashboard/RiskOverview";
import ReportProblem from "../components/dashboard/ReportProblem";
import HighRiskLocations from "../components/dashboard/HighRiskLocations";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import RecentReports from "../components/dashboard/RecentReports";
import QuickActions from "../components/dashboard/QuickActions";
import { useTranslation } from "react-i18next";

function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="p-6 flex-1">
      <SectionHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
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

      <QuickActions />
    </div>
  );
}

export default Dashboard;
