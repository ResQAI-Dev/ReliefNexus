interface RecentActivityProps {
  title?: string;
  description?: string;
}

const RecentActivity = ({
  title = "No recent activity",
  description = "Recent disaster reports and relief activities will appear here.",
}: RecentActivityProps) => {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-xl bg-slate-50">
      <div className="max-w-xs px-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-600">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
};

export default RecentActivity;
