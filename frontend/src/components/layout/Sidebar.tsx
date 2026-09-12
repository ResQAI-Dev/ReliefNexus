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
    <aside style={{backgroundImage:"linear-gradient(rgba(10,25,50,.94),rgba(10,25,50,.97)),url('/images/disaster-hero.png')",backgroundSize:"cover",backgroundPosition:"center"}} className="sticky top-0 hidden h-screen w-64 shrink-0 bg-[#101c35] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
            R
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ReliefNexus</h1>
            <p className="text-[10px] text-slate-400">
              Safer Communities. Stronger Tomorrow.
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>

        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
              item.active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mx-4 mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <ShieldIcon />
        </div>
        <p className="text-sm font-semibold">Stay Safe</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Stay informed and follow official disaster safety guidance.
        </p>
      </div>
    </aside>
  );
};

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Sidebar;

