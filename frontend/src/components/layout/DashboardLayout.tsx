import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

interface SidebarItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
}

const DashboardLayout = ({
  children,
  sidebarItems,
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800">
      <div className="flex min-h-screen">
        <Sidebar items={sidebarItems} />

        <main className="min-w-0 flex-1">
          <DashboardHeader />
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
