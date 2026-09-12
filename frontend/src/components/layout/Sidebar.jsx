import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Map,
  ChartNoAxesColumn,
  Bell,
  FileText,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "../../hooks/useAdminAuth";

const NAV_ITEMS = [
  {
    key: "dashboard",
    labelKey: "navigation.dashboard",
    icon: LayoutDashboard,
    path: "/",
  },

  {
    key: "riskmap",
    labelKey: "navigation.riskMap",
    icon: Map,
    path: "/risk-map",
  },

  {
    key: "riskanalysis",
    labelKey: "navigation.riskAnalysis",
    icon: ChartNoAxesColumn,
    path: "/risk-analysis",
  },

  {
    key: "alerts",
    labelKey: "navigation.alerts",
    icon: Bell,
    path: "/alerts",
  },

  {
    key: "reports",
    labelKey: "navigation.reports",
    icon: FileText,
    path: "/reports",
  },
];

function Sidebar() {
  const { t } = useTranslation();
  const { isAdmin } = useAdminAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex h-full w-60 flex-col bg-brand-900 text-slate-200 border-t border-[#475569] transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none ${mounted ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
        }`}
    >
      <nav className="flex-1 space-y-1 px-3 pt-4">
        {NAV_ITEMS.map(({ key, labelKey, icon: Icon, path }, index) => (
          <NavLink
            key={key}
            to={path}
            style={{ "--enter-delay": `${100 + index * 40}ms` }}
            className={({ isActive }) =>
              `
              group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm
              transition-all duration-200 ease-out motion-reduce:transition-none
              ${mounted ? "nav-item-enter" : "opacity-0"}
              ${isActive
                ? "bg-brand-600 font-medium text-white"
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

            <span>{t(labelKey)}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ease-out ${
                isActive
                  ? "bg-brand-600 font-medium text-white"
                  : "text-slate-300 hover:bg-white/20 hover:translate-x-1"
              }`
            }
          >
            <ShieldCheck size={18} strokeWidth={3} />
            <span>{t("navigation.adminPanel")}</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3">
        {/* Emergency Contact */}
        <div className="rounded-xl border border-red-400/40 bg-gradient-to-b from-red-500/90 to-red-900 px-4 py-3 text-center shadow-md shadow-red-950/40 transition-transform duration-300 ease-out hover:scale-[1.02]">
          <p className="text-xs text-red-100">{t("sidebar.emergency")}</p>

          <div className="mt-1 flex items-center justify-center gap-2 text-white">
            <Phone
              size={16}
              strokeWidth={2}
              className="text-yellow-300 animate-pulse motion-reduce:animate-none"
            />

            <span className="text-sm font-semibold">1078</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
