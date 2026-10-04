import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const DashboardCard = ({
  title,
  subtitle,
  action,
  children,
  className = "",
}: DashboardCardProps) => {
  return (
    <section
      className={`overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[0_5px_22px_rgba(15,35,71,0.055)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0 text-[12px] font-semibold text-blue-600">
            {action}
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        {children}
      </div>
    </section>
  );
};
