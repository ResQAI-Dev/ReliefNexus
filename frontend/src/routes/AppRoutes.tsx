import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import PendingPage from "../pages/auth/PendingPage";

import AffectedUserDashboard from "../pages/dashboards/AffectedUserDashboard";
import FieldVolunteerDashboard from "../pages/dashboards/FieldVolunteerDashboard";
import ReliefCoordinatorDashboard from "../pages/dashboards/ReliefCoordinatorDashboard";
import SystemAdministratorDashboard from "../pages/dashboards/SystemAdministratorDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending" element={<PendingPage />} />

      {/* Role Dashboards */}
      <Route
        path="/dashboard/affected-user"
        element={<AffectedUserDashboard />}
      />

      <Route
        path="/dashboard/field-volunteer"
        element={<FieldVolunteerDashboard />}
      />

      <Route
        path="/dashboard/relief-coordinator"
        element={<ReliefCoordinatorDashboard />}
      />

      <Route
        path="/dashboard/system-administrator"
        element={<SystemAdministratorDashboard />}
      />

      {/* Unknown Route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
