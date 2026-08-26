import {
  AlertTriangle,
  MapPin,
  CloudRain,
  ChevronRight,
  Search,
  Compass,
  Bot,
} from "lucide-react";

// ---- Mock data (swap for your fetched data later) ----------------------

const riskSummary = [
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

const totalAreas = riskSummary.reduce((s, r) => s + r.count, 0);

const highRiskLocations = [
  { name: "Cherrapunji, Meghalaya", score: 86 },
  { name: "Aizawl, Mizoram", score: 82 },
  { name: "Tawang, Arunachal Pradesh", score: 79 },
  { name: "Peren, Nagaland", score: 76 },
  { name: "Kiphire, Nagaland", score: 75 },
];

const recentAlerts = [
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

const recentReports = [
  {
    title: "Road Crack in Cherrapunji",
    detail: "Road crack observed near Mawsmai area.",
    time: "20 min ago",
    status: "PENDING",
    statusColor: "#B45309",
    statusBg: "#FEF3C7",
  },
  {
    title: "Soil Movement in Aizawl",
    detail: "Minor soil movement near Hlimen area.",
    time: "1 hr ago",
    status: "INVESTIGATING",
    statusColor: "#1D4ED8",
    statusBg: "#DBEAFE",
  },
  {
    title: "Small Landslide in Tawang",
    detail: "Small scale landslide near village road.",
    time: "2 hr ago",
    status: "RESOLVED",
    statusColor: "#15803D",
    statusBg: "#DCFCE7",
  },
];

const quickActions = [
  {
    title: "View Risk Map",
    subtitle: "Explore risk levels across North East Region.",
    icon: Compass,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
  },
  {
    title: "Analyze Risk",
    subtitle: "Check risk factors and predictive analysis.",
    icon: Search,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  {
    title: "Ask AI Assistant",
    subtitle: "Get answers about risk, factors and safety.",
    icon: Bot,
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
  },
];

const alertLevelColor = { high: "#DC2626", moderate: "#D97706" };

// ---- Small building blocks -------------------------------------------------

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-3xl border border-gray-300 shadow ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, actionLabel }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <h3 className="text-[16px] font-bold">{title}</h3>
      {actionLabel && (
        <button className="text-xs font-medium hover:text-white hover:bg-blue-600 border hover:border-blue-600 rounded-xl px-2.5 py-1 transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DonutChart({ data, size = 128, thickness = 20 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  const gradientStops = data.map((d) => {
    const start = cumulativePercent;
    const end = cumulativePercent + (d.value / total) * 100;
    cumulativePercent = end;
    return `${d.color} ${start}% ${end}%`;
  }).join(', ');

  const innerRadius = size / 2 - thickness;

  return (
    <div 
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${gradientStops})`,
        WebkitMaskImage: `radial-gradient(circle, transparent ${innerRadius}px, black ${innerRadius + 1}px)`,
        maskImage: `radial-gradient(circle, transparent ${innerRadius}px, black ${innerRadius + 1}px)`
      }} 
    />
  );
}

function Dashboard() {
  const donutData = riskSummary.map((r) => ({
    name: r.label,
    value: r.count,
    color: r.accent,
  }));

  return (
    <div className="p-6 bg-slate-50 flex-1">
      <header className="mb-5">
        <h2 className="text-base font-bold tracking-wide text-slate-900">
          NER RISK OVERVIEW
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Overall risk distribution across North East Region
        </p>
      </header>

      {/* Risk overview + report a problem */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        <Card className="lg:col-span-3 p-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-32 h-32 shrink-0">
            <DonutChart data={donutData} size={128} thickness={20} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400">Total Areas</span>
              <span className="text-2xl font-bold text-slate-900">
                {totalAreas}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 w-full">
            {riskSummary.map((r) => (
              <div key={r.label}>
                <div
                  className="text-xs font-bold tracking-wide"
                  style={{ color: r.accent }}
                >
                  {r.label}
                </div>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  {r.percent}%
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">
                    {r.count}
                  </span>{" "}
                  Areas
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: r.accent }}
                  />
                  {r.status}
                </div>
                <div
                  className="h-1.5 rounded-full mt-3"
                  style={{ backgroundColor: r.barBg }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${r.percent}%`,
                      backgroundColor: r.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 flex flex-col items-start">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Report a Problem</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Help us by reporting landslide or related issues.
          </p>
          <button className="mt-auto w-full bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-[#132a5c] transition-colors">
            Report Now
          </button>
        </Card>
      </div>

      {/* Locations / Alerts / Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card>
          <CardHeader title="HIGH RISK LOCATIONS" actionLabel="View all" />
          <div className="px-5 pb-2 divide-y divide-slate-100">
            {highRiskLocations.map((loc) => (
              <div
                key={loc.name}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-red-500 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {loc.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Risk Score: {loc.score}/100
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 rounded-full px-2.5 py-1">
                  HIGH
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 pt-1">
            <button className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 py-1">
              View all high risk areas
              <ChevronRight size={14} />
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="RECENT ALERTS" actionLabel="View all" />
          <div className="px-5 pb-4 space-y-4">
            {recentAlerts.map((a) => (
              <div key={a.title} className="flex gap-3">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: alertLevelColor[a.level] }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: alertLevelColor[a.level] }}
                    >
                      {a.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>
                  <span
                    className="text-[11px] font-medium mt-1 inline-block"
                    style={{ color: alertLevelColor[a.level] }}
                  >
                    {a.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="RECENT REPORTS" actionLabel="View all" />
          <div className="px-5 pb-4 divide-y divide-slate-100">
            {recentReports.map((r) => (
              <div key={r.title} className="flex items-center gap-3 py-2.5">
                <div className="w-14 h-11 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {r.title}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {r.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{r.detail}</p>
                  <span
                    className="text-[10px] font-bold rounded-full px-2 py-0.5 inline-block mt-1"
                    style={{
                      color: r.statusColor,
                      backgroundColor: r.statusBg,
                    }}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weather banner */}
      <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <CloudRain size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              NER Weather Summary
            </h3>
            <p className="text-sm text-slate-500">
              Moderate to heavy rainfall expected in Meghalaya, Mizoram and
              Arunachal Pradesh in next 24 hours.
            </p>
          </div>
        </div>
        <button className="bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg px-4 py-2.5 whitespace-nowrap hover:bg-[#132a5c] transition-colors">
          View Detailed Forecast
        </button>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {quickActions.map((qa) => {
          const Icon = qa.icon;
          return (
            <Card
              key={qa.title}
              className="p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {qa.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">{qa.subtitle}</div>
              </div>
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: qa.iconBg }}
              >
                <Icon size={18} style={{ color: qa.iconColor }} />
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 pb-2">
        © 2026 AI-Based Early Warning and Landslide Risk Monitoring System. All
        rights reserved.
      </p>
    </div>
  );
}

export default Dashboard;
