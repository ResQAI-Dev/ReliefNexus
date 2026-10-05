import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  onClick?: () => void;
};

export const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  onClick,
}: StatCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[15px] border border-slate-200/80 bg-white p-4 text-left shadow-[0_4px_18px_rgba(15,35,71,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_10px_28px_rgba(15,35,71,0.09)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5ff] text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        <span className="h-[17px] w-[17px]">
          {icon}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-[21px] font-bold leading-6 tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {subtitle}
        </p>
      </div>
    </button>
  );
};
