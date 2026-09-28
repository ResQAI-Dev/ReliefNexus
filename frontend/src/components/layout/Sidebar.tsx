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
        sticky top-0 z-50
        hidden h-screen w-64 shrink-0
        overflow-hidden
        bg-[#0a1b38] text-white
        lg:flex lg:flex-col
      "
    >
      {/* LOGO / BRAND */}
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-950/30">
            R
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-white">
              ReliefNexus
            </h1>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
              Safer Communities. Stronger Tomorrow.
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="min-h-0 flex-1 overflow-hidden px-3 py-4">
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Main Menu
        </p>

        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`group flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                item.active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center transition ${
                  item.active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white"
                }`}
              >
                {item.icon}
              </span>

              <span className="min-w-0 flex-1 truncate">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;