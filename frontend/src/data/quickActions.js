import { Compass, Search, Bot } from "lucide-react";

export const quickActions = [
  {
    title: "View Risk Map",
    subtitle: "Explore risk levels across North East Region.",
    icon: Compass,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    path: "/risk-map",
  },
  {
    title: "Analyze Risk",
    subtitle: "Check risk factors and predictive analysis.",
    icon: Search,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    path: "/risk-analysis",
  },
  {
    title: "Ask AI Assistant",
    subtitle: "Get answers about risk, factors and safety.",
    icon: Bot,
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    path: "/assistant",
  },
];