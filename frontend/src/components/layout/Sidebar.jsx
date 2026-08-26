import React, { useState } from "react";
import {
  LayoutDashboard,
  Map,
  ChartNoAxesColumn,
  Bell,
  FileText,
  Bot,
  Phone,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "riskmap", label: "Risk Map", icon: Map },
  { key: "riskanalysis", label: "Risk Analysis", icon: ChartNoAxesColumn },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "assistant", label: "AI Assistant", icon: Bot },
];

function Sidebar() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="flex h-full w-60 flex-col bg-[#112D4E] text-slate-200 border-t border-[#475569]">
      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 pt-4">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;

          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-[#3F72AF] font-medium text-white"
                  : "text-slate-300 hover:bg-white/20"
              }`}
            >
              <Icon size={18} strokeWidth={3} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Emergency contact */}
      <div className="p-3">
        <div className="rounded-xl border border-red-800/60 bg-gradient-to-b from-red-600/80 to-red-950 px-4 py-3 text-center">
          <p className="text-xs text-slate-300">Emergency Contact</p>

          <div className="mt-1 flex items-center justify-center gap-2 text-white">
            <Phone size={16} strokeWidth={2} className="text-red-500" />
            <span className="text-sm font-semibold">0123456789</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;