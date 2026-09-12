import {
  LayoutDashboard,
  FileText,
  Users,
  MapPinned,
  SlidersHorizontal,
  ScrollText,
  ArrowLeft,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { key: "dashboard", labelKey: "admin.nav.dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { key: "reports", labelKey: "admin.nav.reports", icon: FileText, path: "/admin/reports" },
  { key: "users", labelKey: "admin.nav.users", icon: Users, path: "/admin/users" },
  { key: "riskZones", labelKey: "admin.nav.riskZones", icon: MapPinned, path: "/admin/risk-zones" },
  { key: "config", labelKey: "admin.nav.config", icon: SlidersHorizontal, path: "/admin/config" },
  { key: "auditLogs", labelKey: "admin.nav.auditLogs", icon: ScrollText, path: "/admin/audit-logs" },
];

function AdminSidebar() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-60 flex-col bg-brand-900 text-slate-200 border-t border-[#475569]">
      <div className="px-4 pt-4 pb-2">
        <span className="text-[11px] font-bold tracking-widest text-slate-400">
          {t("admin.nav.panelLabel")}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ key, labelKey, icon: Icon, path }) => (
          <NavLink
            key={key}
            to={path}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ease-out ${
                isActive
                  ? "bg-brand-600 font-medium text-white"
                  : "text-slate-300 hover:bg-white/20 hover:translate-x-1"
              }`
            }
          >
            <Icon size={18} strokeWidth={3} />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          <span>{t("admin.nav.backToApp")}</span>
        </NavLink>
      </div>
    </div>
  );
}

export default AdminSidebar;
