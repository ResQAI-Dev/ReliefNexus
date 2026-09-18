import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";

const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const name = user?.fullName || "Affected User";

  const roleLabel =
    user?.role === "FieldVolunteer"
      ? "Field Volunteer"
      : user?.role === "ReliefCoordinator"
        ? "Relief Coordinator"
        : user?.role === "SystemAdministrator"
          ? "System Administrator"
          : "Affected User";

  const initials = name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const profileRoute = location.pathname.startsWith(
    "/dashboard/system-administrator"
  )
    ? "/dashboard/system-administrator/profile"
    : "/dashboard/user/profile";

  const handleProfile = () => {
    setOpen(false);
    navigate(profileRoute);
  };

  const handleSignOut = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
      {/* LEFT */}
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#101c35]">
          Welcome back, {name.split(" ")[0]}
        </p>

        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
          {roleLabel}
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* REAL NOTIFICATIONS */}
        <NotificationBell />

        {/* PROFILE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white">
              {initials || "U"}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[150px] truncate text-xs font-bold text-slate-800">
                {name}
              </p>

              <p className="text-[9px] font-medium text-slate-400">
                {roleLabel}
              </p>
            </div>

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`hidden text-slate-400 transition sm:block ${
                open ? "rotate-180" : ""
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-[100] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-xs font-bold text-slate-800">
                  {name}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {user?.email}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleProfile}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6" />
                  </svg>

                  Profile
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M10 17l5-5-5-5M15 12H3M21 4v16" />
                  </svg>

                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
