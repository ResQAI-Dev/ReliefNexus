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

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

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
    <header className="sticky top-0 z-50 flex min-h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,35,71,0.04)] backdrop-blur-xl sm:px-7 lg:px-9">
      {/* LEFT */}
      <div className="min-w-0 pr-4">
        <p className="truncate text-[14px] font-black tracking-[-0.01em] text-[#101c35] sm:text-[15px]">
          Welcome back, {name.split(" ")[0]}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <p className="truncate text-[10px] font-semibold text-slate-400 sm:text-[11px]">
            {roleLabel}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* REAL NOTIFICATIONS */}
        <div className="flex items-center justify-center">
          <NotificationBell />
        </div>

        {/* DIVIDER */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* PROFILE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-haspopup="menu"
            className={`group flex items-center gap-2.5 rounded-2xl border px-2 py-1.5 transition-all duration-200 ${
              open
                ? "border-blue-100 bg-blue-50/60 shadow-sm"
                : "border-transparent hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 text-xs font-black text-white shadow-[0_7px_18px_rgba(37,99,235,0.24)] ring-2 ring-white">
                {initials}
              </div>

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>

            {/* User information */}
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[170px] truncate text-[11px] font-black text-slate-800 lg:text-xs">
                {name}
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="truncate text-[9px] font-semibold text-slate-400 lg:text-[10px]">
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Chevron */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                open ? "rotate-180 text-blue-600" : ""
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* PROFILE MENU */}
          {open && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[90] cursor-default bg-transparent"
              />

              <div
                role="menu"
                className="absolute right-0 top-[58px] z-[100] w-[290px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_24px_55px_rgba(15,35,71,0.16)]"
              >
                {/* Menu identity header */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/60 px-5 pb-5 pt-5">
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white shadow-lg shadow-blue-200">
                        {initials}
                      </div>

                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {name}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                        {user?.email || "No email available"}
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-blue-700">
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 p-2.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProfile}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6" />
                      </svg>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-slate-800">
                        Profile
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                        Manage your account details
                      </span>
                    </span>

                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="group mt-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition hover:bg-red-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-100">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M10 17l5-5-5-5M15 12H3M21 4v16" />
                      </svg>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-red-600">
                        Sign Out
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-red-300">
                        End your current session
                      </span>
                    </span>
                  </button>
                </div>

                {/* Security footer */}
                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 3l7 3v5c0 4.7-3 8.2-7 10-4-1.8-7-5.3-7-10V6l7-3z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>

                    <div>
                      <p className="text-[9px] font-black text-slate-700">
                        Secure session
                      </p>
                      <p className="text-[9px] font-medium text-slate-400">
                        Your account is protected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
