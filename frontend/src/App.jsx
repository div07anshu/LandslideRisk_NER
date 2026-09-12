import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import Layout from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

// Lazy load all pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RiskAnalysis = lazy(() => import("./pages/RiskAnalysis"));
const Login = lazy(() => import("./pages/LoginPage"));
const Signup = lazy(() => import("./pages/Signup"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Reports = lazy(() => import("./pages/Reports"));
const Alerts = lazy(() => import("./pages/Alerts"));
const RiskMap = lazy(() => import("./pages/RiskMap"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRiskZones = lazy(() => import("./pages/admin/AdminRiskZones"));
const AdminConfig = lazy(() => import("./pages/admin/AdminConfig"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
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
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="risk-zones" element={<AdminRiskZones />} />
                <Route path="config" element={<AdminConfig />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
