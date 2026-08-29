import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default GuestRoute;
