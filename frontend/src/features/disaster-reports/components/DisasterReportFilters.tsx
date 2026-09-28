import {
  RefreshCw,
  Search,
} from "lucide-react";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  severity: string;
  setSeverity: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

export default function DisasterReportFilters({
  search,
  setSearch,
  severity,
  setSeverity,
  status,
  setStatus,
  type,
  setType,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_170px_auto]">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search disaster, location, reporter..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
        >
          <option>All Types</option>
          <option>Flood</option>
          <option>Landslide</option>
          <option>Earthquake</option>
          <option>Cyclone</option>
          <option>Wildfire</option>
          <option>Drought</option>
          <option>Tsunami</option>
          <option>Lightning</option>
          <option>Tornado</option>
        </select>

        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
        >
          <option>All Severity</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
        >
          <option>All Status</option>
          <option>Submitted</option>
          <option>UnderReview</option>
          <option>Reviewed</option>
          <option>Verified</option>
          <option>VolunteerQueue</option>
          <option>Assigned</option>
          <option>InProgress</option>
          <option>FieldUpdateSubmitted</option>
          <option>FieldCompleted</option>
          <option>Resolved</option>
          <option>Rejected</option>
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>
    </div>
  );
}
