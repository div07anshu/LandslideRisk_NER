import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Map,
  ChartNoAxesColumn,
  Bell,
  FileText,
  Bot,
  Phone,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },

  {
    key: "riskmap",
    label: "Risk Map",
    icon: Map,
    path: "/risk-map",
  },

  {
    key: "riskanalysis",
    label: "Risk Analysis",
    icon: ChartNoAxesColumn,
    path: "/risk-analysis",
  },

  {
    key: "alerts",
    label: "Alerts",
    icon: Bell,
    path: "/alerts",
  },

  {
    key: "reports",
    label: "Reports",
    icon: FileText,
    path: "/reports",
  },

  {
    key: "assistant",
    label: "AI Assistant",
    icon: Bot,
    path: "/assistant",
  },
];

function Sidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex h-full w-60 flex-col bg-[#112D4E] text-slate-200 border-t border-[#475569] transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        mounted ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
      }`}
    >
      <style>{`
        @keyframes navItemIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .nav-item-enter {
          animation: navItemIn 300ms ease-out both;
          animation-delay: var(--enter-delay, 0ms);
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-item-enter {
            animation: none;
          }
        }
      `}</style>

      <nav className="flex-1 space-y-1 px-3 pt-4">
        {NAV_ITEMS.map(({ key, label, icon: Icon, path }, index) => (
          <NavLink
            key={key}
            to={path}
            style={{ "--enter-delay": `${100 + index * 40}ms` }}
            className={({ isActive }) =>
              `
              group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm
              transition-all duration-200 ease-out motion-reduce:transition-none
              ${mounted ? "nav-item-enter" : "opacity-0"}
              ${
                isActive
                  ? "bg-[#3F72AF] font-medium text-white"
                  : "text-slate-300 hover:bg-white/20 hover:translate-x-1"
              }
              `
            }
          >
            <Icon
              size={18}
              strokeWidth={3}
              className="transition-transform duration-200 ease-out group-hover:scale-110"
            />

            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        {/* Emergency Contact */}
        <div className="rounded-xl border border-red-400/40 bg-gradient-to-b from-red-500/90 to-red-900 px-4 py-3 text-center shadow-md shadow-red-950/40 transition-transform duration-300 ease-out hover:scale-[1.02]">
          <p className="text-xs text-red-100">Emergency Contact</p>

          <div className="mt-1 flex items-center justify-center gap-2 text-white">
            <Phone
              size={16}
              strokeWidth={2}
              className="text-yellow-300 animate-pulse motion-reduce:animate-none"
            />

            <span className="text-sm font-semibold">0123456789</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
