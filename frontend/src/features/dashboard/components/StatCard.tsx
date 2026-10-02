interface StatCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconClass?: string;
}

const StatCard = ({
  label,
  value,
  description,
  icon,
  iconClass = "bg-blue-50 text-blue-600",
}: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#101c35]">{value}</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-400">{description}</p>
    </div>
  );
};

export default StatCard;
