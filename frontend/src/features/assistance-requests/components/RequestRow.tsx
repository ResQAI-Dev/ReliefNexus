import type { ReactNode } from "react";

export const RequestRow = ({
  icon,
  title,
  id,
  status,
  statusClass,
  time,
}: {
  icon: ReactNode;
  title: string;
  id: string;
  status: string;
  statusClass: string;
  time: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-800">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{id}</p>
    </div>

    <div className="shrink-0 text-right">
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass}`}>
        {status}
      </span>
      {time && (
        <p className="mt-1 text-[10px] text-slate-400">
          {time}
        </p>
      )}
    </div>
  </div>
);

