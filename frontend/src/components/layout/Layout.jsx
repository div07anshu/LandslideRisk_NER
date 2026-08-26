import Dashboard from "../dashboard/Dashboard";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
  return (
    <div className="flex h-screen flex-col">
      <Topbar userName="Madhur" userRole="Analyst" notificationCount={3} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-[#F9F7F7] p-6">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default Layout;
