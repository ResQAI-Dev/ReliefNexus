import { useMemo, useState, type ReactNode, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";

interface SidebarItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardLayoutProps {
  sidebarItems: SidebarItem[];
  children: ReactNode;
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]" aria-hidden="true">
    <path
      d="M18 9.5a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18c0-1.5-3-1.5-3-8.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
    <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LogoMark = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-blue-900/20">
    R
  </div>
);

const DashboardLayout = ({ sidebarItems, children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = user?.fullName?.trim() || "User";
  const rawRole = user?.role || "User";
  const role = rawRole
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U";
  }, [displayName]);

  const dashboardRoot = useMemo(() => {
    const match = location.pathname.match(/^\/dashboard\/[^/]+/);
    return match?.[0] || "/dashboard/user";
  }, [location.pathname]);

  const goToProfile = () => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    navigate(`${dashboardRoot}/profile`);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearch("");
      event.currentTarget.blur();
    }
  };
  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };


  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-800">
      <Sidebar items={sidebarItems} />

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="relative flex h-full w-[290px] flex-col bg-[#0a1b38] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <LogoMark />
                <div>
                  <p className="text-base font-black tracking-tight">ReliefNexus</p>
                  <p className="text-[9px] text-slate-400">
                    Safer Communities. Stronger Tomorrow.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5">
              <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Main Menu
              </p>

              <div className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onClick?.();
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      item.active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="border-t border-white/10 p-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-bold text-white">Stay Safe</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Stay informed and follow official disaster safety guidance.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-64">
        {/* Global top header */}
        <header className="sticky top-0 z-50 h-[72px] border-b border-slate-200/90 bg-white/95 shadow-[0_1px_10px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
            {/* Left */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon />
              </button>

              <div className="hidden min-w-0 md:flex h-[44px] w-full max-w-[430px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                <span className="shrink-0 text-slate-400">
                  <SearchIcon />
                </span>

                <input
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search incidents, users, reports..."
                  aria-label="Search incidents, users, reports"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />

                <span className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold tracking-wide text-slate-400 lg:inline-flex">
                  SEARCH
                </span>
              </div>

              <div className="md:hidden">
                <p className="text-sm font-black tracking-tight text-slate-900">
                  ReliefNexus
                </p>
                <p className="text-[9px] font-semibold text-slate-400">
                  Control Center
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Notifications"
              >
                <BellIcon />
                <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="group flex items-center gap-2 rounded-2xl border border-transparent px-2 py-1.5 text-left transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm sm:gap-3"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-xs font-black text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50/80">
                    {initials}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <p className="max-w-[190px] truncate text-[12px] font-extrabold leading-4 text-slate-800">
                      {displayName}
                    </p>
                    <p className="mt-0.5 max-w-[190px] truncate text-[10px] font-semibold leading-4 text-slate-400">
                      {role}
                    </p>
                  </div>

                  <span className="hidden text-slate-400 transition group-hover:text-slate-700 sm:block">
                    <ChevronDownIcon />
                  </span>
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[285px] overflow-hidden rounded-[22px] border border-slate-200/90 bg-white p-2 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/[0.03]"
                    role="menu"
                  >
                    <div className="rounded-[17px] bg-slate-50/80 px-3.5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow-sm">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-extrabold text-slate-900">
                            {displayName}
                          </p>
                          <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                            {role}
                          </p>
                        </div>
                        <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={goToProfile}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-blue-50"
                      role="menuitem"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                        <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]" aria-hidden="true">
                          <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </span>
                      <span className="flex-1">
                        <span className="block text-[12px] font-extrabold text-slate-800">
                          View Profile
                        </span>
                        <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                          Manage your account
                        </span>
                      </span>
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-slate-300" aria-hidden="true">
                        <path d="m7.5 4 4 6-4 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="my-1.5 h-px bg-slate-100" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-red-50"
                      role="menuitem"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors group-hover:bg-red-100">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-[17px] w-[17px]"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 17l5-5-5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 12H3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M21 19V5a2 2 0 0 0-2-2h-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>

                      <span className="flex-1">
                        <span className="block text-[12px] font-extrabold text-red-600">
                          Sign Out
                        </span>
                        <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                          Sign out of your account
                        </span>
                      </span>

                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 text-slate-300 transition-colors group-hover:text-red-400"
                        aria-hidden="true"
                      >
                        <path
                          d="m7.5 4 4 6-4 6"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-72px)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

