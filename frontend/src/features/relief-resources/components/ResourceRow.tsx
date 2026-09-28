import type { ReactNode } from "react";

export const ResourceRow = ({
  icon,
  title,
  meta,
  status,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  status: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-400">
        {meta} ¬{status}
      </p>
    </div>
  </div>
);





