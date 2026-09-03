import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FloatingAIAssistant from "../ai-floating/FloatingAIAssistant";
import { Outlet, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();
  const [contentVisible, setContentVisible] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    setContentVisible(false);
    const id = requestAnimationFrame(() => setContentVisible(true));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  return (
    <div className="flex h-screen flex-col">
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className={`flex-1 overflow-y-auto no-scrollbar bg-[#F9F7F7] p-6 transition-all duration-300 ease-out ${aiOpen ? "mr-[400px]" : "mr-0"
            }`}
        >
          <div
            key={location.pathname}
            className={`transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ${contentVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
              }`}
          >
            <Outlet />
          </div>
        </main>
      </div>

      <FloatingAIAssistant onOpenChange={setAiOpen} />
    </div>
  );
}

export default Layout;