interface RiskCardProps {
  title?: string;
  description?: string;
}

const RiskCard = ({
  title = "Risk information unavailable",
  description = "AI risk predictions and location-based alerts will appear here when data is available.",
}: RiskCardProps) => {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
      <div className="max-w-sm px-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
            <path d="M12 8v4M12 15h.01" />
          </svg>
        </div>

        <h4 className="mt-4 font-semibold text-slate-700">{title}</h4>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
};

export default RiskCard;
