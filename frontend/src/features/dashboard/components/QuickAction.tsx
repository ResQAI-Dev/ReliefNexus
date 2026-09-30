import type { ReactNode } from "react";

type QuickActionProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

export const QuickAction = ({
  icon,
  title,
  description,
  onClick,
}: QuickActionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[116px] w-full flex-col rounded-[14px] border border-slate-200 bg-[#f8fbff] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_8px_22px_rgba(37,99,235,0.09)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition group-hover:border-blue-100 group-hover:bg-blue-50">
        <span className="h-[17px] w-[17px]">
          {icon}
        </span>
      </div>

      <div className="mt-auto pt-4 pr-5">
        <p className="text-[12px] font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          {description}
        </p>
      </div>

      <span className="absolute bottom-4 right-4 text-[15px] font-medium text-blue-500 transition-transform group-hover:translate-x-1">
        
      </span>
    </button>
  );
};
