import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import RiskAnalysis from "./pages/RiskAnalysis";
import Login from "./pages/LoginPage";
import Signup from "./pages/Signup";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import RiskMap from "./pages/RiskMap";
import AIAssistant from "./pages/AIAssistant";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="risk-analysis" element={<RiskAnalysis />} />
            <Route path="reports" element={<Reports />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="risk-map" element={<RiskMap />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
