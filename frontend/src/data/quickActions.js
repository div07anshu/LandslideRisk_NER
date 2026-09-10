import { Compass, Search, Bell } from "lucide-react";

export const quickActions = [
  {
    titleKey: "quickActions.viewRiskMap",
    subtitleKey: "quickActions.viewRiskMapSubtitle",
    icon: Compass,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    path: "/risk-map",
  },

  {
    titleKey: "quickActions.analyzeRisk",
    subtitleKey: "quickActions.analyzeRiskSubtitle",
    icon: Search,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    path: "/risk-analysis",
  },

  {
    titleKey: "quickActions.activeAlerts",
    subtitleKey: "quickActions.activeAlertsSubtitle",
    icon: Bell,
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    path: "/alerts",
  },
];