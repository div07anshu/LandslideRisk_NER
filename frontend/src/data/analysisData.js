import {
  Mountain,
  CloudRain,
  Droplets,
  Waves,
  TreePine,
  History,
} from "lucide-react";

export const AREAS = [
  {
    id: "kohima",
    name: "Kohima Ridge",
    state: "Nagaland",
    riskScore: 78,
    riskLevel: "high",
    trend: "up",

    factors: [
      {
        key: "rainfall",
        label: "Rainfall intensity",
        value: 82,
        icon: CloudRain,
      },
      { key: "slope", label: "Slope gradient", value: 74, icon: Mountain },
      { key: "soil", label: "Soil saturation", value: 71, icon: Droplets },
      { key: "seismic", label: "Seismic activity", value: 38, icon: Waves },
      {
        key: "vegetation",
        label: "Vegetation cover",
        value: 24,
        icon: TreePine,
        inverse: true,
      },
      {
        key: "history",
        label: "Past incidents (5yr)",
        value: 65,
        icon: History,
      },
    ],

    history: [
      { day: "Aug 1", score: 52 },
      { day: "Aug 6", score: 55 },
      { day: "Aug 11", score: 61 },
      { day: "Aug 16", score: 68 },
      { day: "Aug 21", score: 74 },
      { day: "Aug 26", score: 78 },
    ],
  },

  {
    id: "shillong",
    name: "Mawkynroh",
    state: "Meghalaya",
    riskScore: 63,
    riskLevel: "moderate",
    trend: "up",

    factors: [
      {
        key: "rainfall",
        label: "Rainfall intensity",
        value: 88,
        icon: CloudRain,
      },
      { key: "slope", label: "Slope gradient", value: 55, icon: Mountain },
      { key: "soil", label: "Soil saturation", value: 60, icon: Droplets },
      { key: "seismic", label: "Seismic activity", value: 30, icon: Waves },
      {
        key: "vegetation",
        label: "Vegetation cover",
        value: 42,
        icon: TreePine,
        inverse: true,
      },
      {
        key: "history",
        label: "Past incidents (5yr)",
        value: 48,
        icon: History,
      },
    ],

    history: [
      { day: "Aug 1", score: 44 },
      { day: "Aug 6", score: 47 },
      { day: "Aug 11", score: 50 },
      { day: "Aug 16", score: 54 },
      { day: "Aug 21", score: 59 },
      { day: "Aug 26", score: 63 },
    ],
  },

  {
    id: "gangtok",
    name: "Rumtek Slope",
    state: "Sikkim",
    riskScore: 45,
    riskLevel: "moderate",
    trend: "flat",

    factors: [
      {
        key: "rainfall",
        label: "Rainfall intensity",
        value: 51,
        icon: CloudRain,
      },
      { key: "slope", label: "Slope gradient", value: 68, icon: Mountain },
      { key: "soil", label: "Soil saturation", value: 40, icon: Droplets },
      { key: "seismic", label: "Seismic activity", value: 52, icon: Waves },
      {
        key: "vegetation",
        label: "Vegetation cover",
        value: 58,
        icon: TreePine,
        inverse: true,
      },
      {
        key: "history",
        label: "Past incidents (5yr)",
        value: 33,
        icon: History,
      },
    ],

    history: [
      { day: "Aug 1", score: 46 },
      { day: "Aug 6", score: 45 },
      { day: "Aug 11", score: 47 },
      { day: "Aug 16", score: 44 },
      { day: "Aug 21", score: 46 },
      { day: "Aug 26", score: 45 },
    ],
  },

  {
    id: "itanagar",
    name: "Ganga Market Slope",
    state: "Arunachal Pradesh",
    riskScore: 29,
    riskLevel: "low",
    trend: "down",

    factors: [
      {
        key: "rainfall",
        label: "Rainfall intensity",
        value: 40,
        icon: CloudRain,
      },
      { key: "slope", label: "Slope gradient", value: 35, icon: Mountain },
      { key: "soil", label: "Soil saturation", value: 28, icon: Droplets },
      { key: "seismic", label: "Seismic activity", value: 44, icon: Waves },
      {
        key: "vegetation",
        label: "Vegetation cover",
        value: 70,
        icon: TreePine,
        inverse: true,
      },
      {
        key: "history",
        label: "Past incidents (5yr)",
        value: 18,
        icon: History,
      },
    ],

    history: [
      { day: "Aug 1", score: 38 },
      { day: "Aug 6", score: 35 },
      { day: "Aug 11", score: 34 },
      { day: "Aug 16", score: 31 },
      { day: "Aug 21", score: 30 },
      { day: "Aug 26", score: 29 },
    ],
  },

  {
    id: "aizawl",
    name: "Zarkawt Heights",
    state: "Mizoram",
    riskScore: 56,
    riskLevel: "moderate",
    trend: "up",

    factors: [
      {
        key: "rainfall",
        label: "Rainfall intensity",
        value: 66,
        icon: CloudRain,
      },
      { key: "slope", label: "Slope gradient", value: 80, icon: Mountain },
      { key: "soil", label: "Soil saturation", value: 49, icon: Droplets },
      { key: "seismic", label: "Seismic activity", value: 41, icon: Waves },
      {
        key: "vegetation",
        label: "Vegetation cover",
        value: 38,
        icon: TreePine,
        inverse: true,
      },
      {
        key: "history",
        label: "Past incidents (5yr)",
        value: 52,
        icon: History,
      },
    ],

    history: [
      { day: "Aug 1", score: 47 },
      { day: "Aug 6", score: 49 },
      { day: "Aug 11", score: 50 },
      { day: "Aug 16", score: 52 },
      { day: "Aug 21", score: 54 },
      { day: "Aug 26", score: 56 },
    ],
  },
];

export const RANGE_OPTIONS = ["7 days", "30 days", "90 days"];

export const LEVEL_STYLES = {
  low: {
    text: "text-[#16A34A]",
    bg: "bg-[#DCFCE7]",
    ring: "ring-[#22C55E]",
    bar: "#22C55E",
  },

  moderate: {
    text: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    ring: "ring-[#F59E0B]",
    bar: "#F59E0B",
  },

  high: {
    text: "text-[#DC2626]",
    bg: "bg-[#FEE2E2]",
    ring: "ring-[#EF4444]",
    bar: "#EF4444",
  },
};
