import type { ReactNode } from "react";
import type { AssistanceRequest } from "../../dashboard/types/userDashboard.types";
import { formatDate } from "../../dashboard/utils/userDashboard.utils";

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" />
  </svg>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-12 text-sm text-slate-500">
    Loading...
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
    {text}
  </div>
);

const getStatusClass = (status?: string) => {
  const value = (status || "").toLowerCase();

  if (["approved", "completed", "resolved", "fulfilled"].includes(value)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (["pending", "in progress", "processing"].includes(value)) {
    return "bg-amber-50 text-amber-700";
  }

  if (["rejected", "cancelled", "canceled", "failed"].includes(value)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
};

const RequestRow = ({
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
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{id}</p>
    </div>

    <div className="shrink-0 text-right">
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass}`}>
        {status}
      </span>
      {time && <p className="mt-2 text-[10px] text-slate-400">{time}</p>}
    </div>
  </div>
);

export const RequestsContent = ({
  requests,
  loading,
  limit,
}: {
  requests: AssistanceRequest[];
  loading: boolean;
  limit?: number;
}) => {
  if (loading) return <LoadingState />;

  if (!requests.length) {
    return (
      <EmptyState text="No assistance requests have been returned by the API." />
    );
  }

  return (
    <div className="space-y-1">
      {requests.slice(0, limit).map((request, index) => (
        <RequestRow
          key={request.id ?? request.requestId ?? index}
          icon={<ClipboardIcon />}
          title={request.title || request.type || "Assistance request"}
          id={request.requestId || request.id || "No ID"}
          status={request.status || "Unknown"}
          statusClass={getStatusClass(request.status)}
          time={formatDate(request.updatedAt || request.createdAt)}
        />
      ))}
    </div>
  );
};

