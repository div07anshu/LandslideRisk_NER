import { AlertTriangle, CloudRain, Droplets, Waves } from "lucide-react";

export const ALERT_LEVEL_FILTERS = ["All", "high", "moderate", "low"];

export const ALERT_STATUS_STYLES = {
  ACTIVE: { color: "#B91C1C", bg: "#FEE2E2" },
  MONITORING: { color: "#1D4ED8", bg: "#DBEAFE" },
  RESOLVED: { color: "#15803D", bg: "#DCFCE7" },
};

export const INITIAL_ALERTS = [
  {
    id: "al1",
    title: "High Risk Alert - Cherrapunji",
    detail:
      "High rainfall + steep slope detected. Immediate field inspection recommended.",
    location: "Cherrapunji, Meghalaya",
    level: "high",
    time: "10 min ago",
    status: "ACTIVE",
    icon: CloudRain,
  },
  {
    id: "al2",
    title: "Moderate Risk Alert - Aizawl",
    detail:
      "Soil moisture high. Landslide possible. Stay alert and monitor the area.",
    location: "Zarkawt Heights, Aizawl",
    level: "moderate",
    time: "45 min ago",
    status: "MONITORING",
    icon: Droplets,
  },
  {
    id: "al3",
    title: "High Risk Alert - West Jaintia Hills",
    detail: "Continuous rainfall and unstable slope. Avoid unnecessary travel.",
    location: "West Jaintia Hills, Meghalaya",
    level: "high",
    time: "1 hr ago",
    status: "ACTIVE",
    icon: CloudRain,
  },
  {
    id: "al4",
    title: "High Risk Alert - Tawang",
    detail:
      "Seismic tremor detected near steep slope. Field team dispatched for inspection.",
    location: "Tawang, Arunachal Pradesh",
    level: "high",
    time: "2 hr ago",
    status: "MONITORING",
    icon: Waves,
  },
  {
    id: "al5",
    title: "Moderate Risk Alert - Peren",
    detail: "Rising soil saturation following overnight rainfall.",
    location: "Peren, Nagaland",
    level: "moderate",
    time: "3 hr ago",
    status: "ACTIVE",
    icon: Droplets,
  },
  {
    id: "al6",
    title: "Low Risk Advisory - Rumtek Slope",
    detail: "Conditions stable. Routine monitoring continues.",
    location: "Rumtek Slope, Sikkim",
    level: "low",
    time: "5 hr ago",
    status: "RESOLVED",
    icon: AlertTriangle,
  },
  {
    id: "al7",
    title: "Moderate Risk Alert - Kiphire",
    detail: "Slope movement detected near village road, being tracked closely.",
    location: "Kiphire, Nagaland",
    level: "moderate",
    time: "8 hr ago",
    status: "MONITORING",
    icon: Waves,
  },
  {
    id: "al8",
    title: "Low Risk Advisory - Ganga Market Slope",
    detail: "Vegetation cover holding well, no significant risk indicators.",
    location: "Ganga Market Slope, Itanagar",
    level: "low",
    time: "1 day ago",
    status: "RESOLVED",
    icon: AlertTriangle,
  },
];