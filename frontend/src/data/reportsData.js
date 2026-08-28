import { AlertTriangle, Droplets, Waves, CloudRain, HelpCircle } from "lucide-react";

export const STATUS_STYLES = {
  PENDING: { color: "#B45309", bg: "#FEF3C7" },
  INVESTIGATING: { color: "#1D4ED8", bg: "#DBEAFE" },
  RESOLVED: { color: "#15803D", bg: "#DCFCE7" },
};

export const STATUS_FILTERS = ["All", "PENDING", "INVESTIGATING", "RESOLVED"];

export const CATEGORIES = [
  { value: "road_crack", label: "Road Crack", icon: AlertTriangle },
  { value: "soil_movement", label: "Soil Movement", icon: Waves },
  { value: "landslide", label: "Landslide", icon: Droplets },
  { value: "flooding", label: "Flooding / Water Logging", icon: CloudRain },
  { value: "other", label: "Other", icon: HelpCircle },
];

export const INITIAL_REPORTS = [
  {
    id: "r1",
    title: "Road Crack in Cherrapunji",
    location: "Mawsmai area, Cherrapunji",
    detail: "Road crack observed near Mawsmai area, roughly 2 meters long.",
    category: "road_crack",
    reporter: "Field Team - Meghalaya",
    time: "20 min ago",
    status: "PENDING",
  },
  {
    id: "r2",
    title: "Soil Movement in Aizawl",
    location: "Hlimen area, Aizawl",
    detail: "Minor soil movement near Hlimen area following heavy rainfall.",
    category: "soil_movement",
    reporter: "Local Resident",
    time: "1 hr ago",
    status: "INVESTIGATING",
  },
  {
    id: "r3",
    title: "Small Landslide in Tawang",
    location: "Village road, Tawang",
    detail: "Small scale landslide near village road, partially blocking one lane.",
    category: "landslide",
    reporter: "Field Team - Arunachal Pradesh",
    time: "2 hr ago",
    status: "RESOLVED",
  },
  {
    id: "r4",
    title: "Water Logging near Kohima Ridge",
    location: "Kohima Ridge, Nagaland",
    detail: "Persistent water logging observed at the base of the slope after continuous rain.",
    category: "flooding",
    reporter: "Local Resident",
    time: "5 hr ago",
    status: "PENDING",
  },
  {
    id: "r5",
    title: "Slope Instability near Rumtek",
    location: "Rumtek Slope, Sikkim",
    detail: "Visible tilting of trees suggesting slope movement.",
    category: "soil_movement",
    reporter: "Field Team - Sikkim",
    time: "1 day ago",
    status: "RESOLVED",
  },
];