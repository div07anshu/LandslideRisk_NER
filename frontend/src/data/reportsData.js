import {
  AlertTriangle,
  Droplets,
  Waves,
  CloudRain,
  HelpCircle,
} from "lucide-react";

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

export function categoryMeta(value) {
  return (
    CATEGORIES.find((c) => c.value === value) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}
