import type { ReactNode } from "react";

interface SidebarItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar = ({ items }: SidebarProps) => {
  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-50 hidden
        h-screen w-64 shrink-0
        flex-col overflow-hidden
        bg-[#0a1b38] text-white
        lg:flex
      "
    >
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl bg-blue-600 text-lg font-bold
              shadow-lg shadow-blue-950/30
            "
          >
            R
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              ReliefNexus
            </h1>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
              Safer Communities. Stronger Tomorrow.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}
      <nav
        className="
          min-h-0 flex-1 overflow-y-auto
          px-3 py-5
          overscroll-contain
          [scrollbar-width:thin]
          [scrollbar-color:rgba(148,163,184,.35)_transparent]
        "
      >
        <p
          className="
            mb-3 px-3
            text-[10px] font-semibold uppercase
            tracking-[0.18em] text-slate-500
          "
        >
          Main Menu
        </p>

        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`
                group flex w-full items-center gap-3
                rounded-xl px-3 py-3
                text-left text-sm
                transition-all duration-200
                ${
                  item.active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }
              `}
            >
              <span
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center
                  ${
                    item.active
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }
                `}
              >
                {item.icon}
              </span>

              <span className="min-w-0 flex-1 leading-5">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* =====================================================
          SAFETY CARD
      ===================================================== */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div
          className="
            rounded-2xl border border-white/10
            bg-white/[0.05] p-4
          "
        >
          <div
            className="
              mb-3 flex h-10 w-10
              items-center justify-center
              rounded-xl bg-emerald-500/15
              text-emerald-400
            "
          >
            <ShieldIcon />
          </div>

          <p className="text-sm font-semibold text-white">
            Stay Safe
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Stay informed and follow official disaster safety guidance.
          </p>
        </div>
      </div>
    </aside>
  );
};

const ShieldIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Sidebar;