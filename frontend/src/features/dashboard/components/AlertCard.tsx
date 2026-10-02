interface AlertCardProps {
  title?: string;
  description?: string;
  severity?: string;
}

const AlertCard = ({
  title = "No alerts available",
  description = "New official disaster warnings will appear here.",
  severity = "No active alerts",
}: AlertCardProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-500">
          {severity}
        </span>
      </div>
    </div>
  );
};

export default AlertCard;
