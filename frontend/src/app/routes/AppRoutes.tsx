import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "../../pages/LandingPage";
import LoginPage from "../../features/authentication/pages/LoginPage";
import RegisterPage from "../../features/authentication/pages/RegisterPage";
import PendingPage from "../../features/authentication/pages/PendingPage";

import UserDashboard from "../../features/dashboard/pages/UserDashboard";
import SystemAdministratorDashboard from "../../features/dashboard/pages/SystemAdministratorDashboard";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending" element={<PendingPage />} />

      {/* Risk Prediction dedicated application page */}

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