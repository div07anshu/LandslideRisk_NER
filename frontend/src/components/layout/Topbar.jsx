import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";

function Topbar({
  userName = "Madhur",
  userRole = "Analyst",
  notificationCount = 3,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between bg-[#112D4E] px-6">
      {/* System title */}
      <div>
        <h1 className="text-lg font-semibold leading-tight text-white">
          NER Landslide Early Warning System
        </h1>
        <p className="text-xs text-slate-400">
          North East Region (NER)
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="relative rounded-full p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={3} />

          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User login box */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initials}
            </div>

            <div className="text-left leading-tight">
              <p className="text-sm font-medium text-slate-900">
                {userName}
              </p>
              <p className="text-[11px] text-slate-500">
                {userRole}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-slate-500 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
                <User size={16} strokeWidth={2} />
                Profile
              </button>

              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
                <Settings size={16} strokeWidth={2} />
                Settings
              </button>

              <button className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2.5 text-sm text-red-600 hover:bg-slate-100">
                <LogOut size={16} strokeWidth={2} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;