import type { ReactNode } from "react";

export const RiskMetric = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-blue-600">{icon}</div>
    <p className="mt-2 text-[11px] font-medium text-slate-400">{label}</p>
    <p className="mt-0.5 text-xs font-bold text-slate-700">{value}</p>
  </div>
);



