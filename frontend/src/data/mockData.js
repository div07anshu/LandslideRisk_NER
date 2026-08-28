export const riskSummary = [
  {
    label: "LOW RISK",
    percent: 61,
    count: 67,
    status: "Safe conditions",
    accent: "#16A34A",
    barBg: "#DCFCE7",
  },
  {
    label: "MODERATE RISK",
    percent: 24,
    count: 26,
    status: "Be prepared",
    accent: "#D97706",
    barBg: "#FEF3C7",
  },
  {
    label: "HIGH RISK",
    percent: 15,
    count: 17,
    status: "Take action",
    accent: "#DC2626",
    barBg: "#FEE2E2",
  },
];

export const totalAreas = riskSummary.reduce((s, r) => s + r.count, 0);

export const highRiskLocations = [
  { name: "Cherrapunji, Meghalaya", score: 86 },
  { name: "Aizawl, Mizoram", score: 82 },
  { name: "Tawang, Arunachal Pradesh", score: 79 },
  { name: "Peren, Nagaland", score: 76 },
  { name: "Kiphire, Nagaland", score: 75 },
];

export const recentAlerts = [
  {
    title: "High Risk Alert - Cherrapunji",
    detail:
      "High rainfall + steep slope detected. Immediate field inspection recommended.",
    time: "10 min ago",
    level: "high",
  },
  {
    title: "Moderate Risk Alert - Aizawl",
    detail:
      "Soil moisture high. Landslide possible. Stay alert and monitor the area.",
    time: "45 min ago",
    level: "moderate",
  },
  {
    title: "High Risk Alert - West Jaintia Hills",
    detail: "Continuous rainfall and unstable slope. Avoid unnecessary travel.",
    time: "1 hr ago",
    level: "high",
  },
];

export const recentReports = [
  {
    title: "Road Crack in Cherrapunji",
    detail: "Road crack observed near Mawsmai area.",
    time: "20 min ago",
    status: "PENDING",
    statusColor: "#B45309",
    statusBg: "#FEF3C7",
    category: "road_crack",
  },
  {
    title: "Soil Movement in Aizawl",
    detail: "Minor soil movement near Hlimen area.",
    time: "1 hr ago",
    status: "INVESTIGATING",
    statusColor: "#1D4ED8",
    statusBg: "#DBEAFE",
    category: "soil_movement",
  },
  {
    title: "Small Landslide in Tawang",
    detail: "Small scale landslide near village road.",
    time: "2 hr ago",
    status: "RESOLVED",
    statusColor: "#15803D",
    statusBg: "#DCFCE7",
    category: "landslide",
  },
];

export const alertLevelColor = { high: "#DC2626", moderate: "#D97706" };
