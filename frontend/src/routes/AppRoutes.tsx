import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import PendingPage from "../pages/auth/PendingPage";

import UserDashboard from "../pages/dashboards/UserDashboard";
import SystemAdministratorDashboard from "../pages/dashboards/SystemAdministratorDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending" element={<PendingPage />} />

      <Route
        path="/dashboard/user/*"
        element={<UserDashboard />}
      />

      <Route
        path="/dashboard/system-administrator/*"
        element={<SystemAdministratorDashboard />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
