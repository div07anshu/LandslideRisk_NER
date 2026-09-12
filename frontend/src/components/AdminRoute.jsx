import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import LoadingScreen from "./LoadingScreen";
import Unauthorized from "../pages/Unauthorized";

/**
 * Frontend gate for /admin/*. This is a UX convenience only — every admin
 * backend endpoint independently re-checks the ADMIN role via requireAdmin,
 * so this component cannot itself be a security boundary.
 */
function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminAuth();

  if (authLoading || roleLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Unauthorized />;
  }

  return children;
}

export default AdminRoute;
