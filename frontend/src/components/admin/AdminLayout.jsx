import Topbar from "../layout/Topbar";
import AdminSidebar from "./AdminSidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#F9F7F7] px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
