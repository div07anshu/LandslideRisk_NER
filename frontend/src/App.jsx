import { BrowserRouter, Routes, Route } from "react-router-dom";
import DistrictMapTest from "./pages/DistrictMapTest";

import Layout from "./components/layout/Layout";

import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import RiskAnalysis from "./pages/RiskAnalysis";
import Login from "./pages/LoginPage";
import Signup from "./pages/Signup";
import UpdatePassword from "./pages/UpdatePassword";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import RiskMap from "./pages/RiskMap";
import AIAssistant from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            }
          />

          <Route path="/update-password" element={<UpdatePassword />} />

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
            <Route path="district-map-test" element={<DistrictMapTest />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;