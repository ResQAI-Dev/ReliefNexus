import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";



const LandingPage = lazy(
  () => import("../../features/landing/pages/LandingPage")
);

const LoginPage = lazy(
  () => import("../../features/authentication/pages/LoginPage")
);

const RegisterPage = lazy(
  () => import("../../features/authentication/pages/RegisterPage")
);

const PendingPage = lazy(
  () => import("../../features/authentication/pages/PendingPage")
);
const UserDashboard = lazy(
  () => import("../../features/dashboard/pages/UserDashboard")
);

const SystemAdministratorDashboard = lazy(
  () => import("../../features/dashboard/pages/SystemAdministratorDashboard")
);

const FieldVolunteerAssignedIncidents = lazy(
  () =>
    import(
      "../../features/disaster-reports/pages/FieldVolunteerAssignedIncidents"
    )
);

const RouteLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      <p className="text-sm font-medium text-slate-400">
        Loading ReliefNexus...
      </p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
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
          path="/dashboard/field-volunteer/incidents"
          element={<FieldVolunteerAssignedIncidents />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


