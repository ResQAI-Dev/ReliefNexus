import {
  CheckCircle2,
  Eye,
  MapPin,
  UserRound,
} from "lucide-react";

import type { DisasterReport } from "../types/disasterReports.types";

type Props = {
  reports: DisasterReport[];
  onSelect: (report: DisasterReport) => void;
};

const imageMap: Record<string, string> = {
  avalanche: "/assets/disasters/avalanche.jpg",
  cyclone: "/assets/disasters/cyclone.jpg",
  drought: "/assets/disasters/drought.jpg",
  earthquake: "/assets/disasters/earthquake.jpg",
  flood: "/assets/disasters/flood.jpg",
  hailstorm: "/assets/disasters/hailstorm.jpg",
  landslide: "/assets/disasters/landslide.jpg",
  lightning: "/assets/disasters/lightning.jpg",
  tornado: "/assets/disasters/tornado.jpg",
  tsunami: "/assets/disasters/tsunami.jpg",
  "volcanic eruption":
    "/assets/disasters/volcanic-eruption.jpg",
  wildfire: "/assets/disasters/wildfire.jpg",
};

const getImage = (type?: string | null) => {
  const key = String(type || "")
    .trim()
    .toLowerCase();

  return (
    imageMap[key] ||
    "/assets/disasters/flood.jpg"
  );
};

const severityClass = (severity?: string | null) => {
  const value = String(severity || "").toLowerCase();

  if (value === "critical") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (value === "high") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (value === "medium") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-100";
};

const statusClass = (status?: string | null) => {
  const value = String(status || "").toLowerCase();

  if (value === "resolved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value === "rejected") {
    return "bg-red-50 text-red-700";
  }

  if (
    value === "assigned" ||
    value === "inprogress" ||
    value === "fieldupdatesubmitted" ||
    value === "fieldcompleted"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (value === "verified" || value === "volunteerqueue") {
    return "bg-violet-50 text-violet-700";
  }

  return "bg-amber-50 text-amber-700";
};

export default function DisasterReportsTable({
  reports,
  onSelect,
}: Props) {
  if (reports.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <CheckCircle2
              size={25}
              className="text-slate-300"
            />
          </div>

          <h3 className="mt-4 text-sm font-black text-slate-800">
            No disaster reports found
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Try changing the filters or search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1050px] text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Disaster
            </th>

            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Location
            </th>

            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Severity
            </th>

            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Risk
            </th>

            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Volunteer
            </th>

            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Status
            </th>

            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={getImage(report.disasterType)}
                    alt={report.disasterType || "Disaster"}
                    className="h-12 w-14 rounded-xl object-cover"
                  />

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {report.disasterType || "Unknown Disaster"}
                    </p>

                    <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                      {report.reporterName ||
                        report.reporterEmail ||
                        "Affected User"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="flex max-w-[180px] items-start gap-2">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-blue-500"
                  />

                  <div>
                    <p className="truncate text-xs font-bold text-slate-700">
                      {report.location || "Unknown"}
                    </p>

                    {report.latitude != null &&
                      report.longitude != null && (
                        <p className="mt-1 font-mono text-[9px] text-slate-400">
                          {report.latitude.toFixed(4)},{" "}
                          {report.longitude.toFixed(4)}
                        </p>
                      )}
                  </div>
                </div>
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${severityClass(
                    report.severity
                  )}`}
                >
                  {report.severity || "Medium"}
                </span>
              </td>

              <td className="px-5 py-4">
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {typeof report.riskScore === "number"
                      ? `${Math.round(report.riskScore)}%`
                      : "—"}
                  </p>

                  {report.riskLevel && (
                    <p className="text-[10px] font-semibold text-slate-400">
                      {report.riskLevel}
                    </p>
                  )}
                </div>
              </td>

              <td className="px-5 py-4">
                {report.assignedVolunteerName ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <UserRound
                        size={14}
                        className="text-blue-600"
                      />
                    </div>

                    <span className="max-w-[120px] truncate text-xs font-bold text-slate-700">
                      {report.assignedVolunteerName}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    Not assigned
                  </span>
                )}
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(
                    report.status
                  )}`}
                >
                  {report.status || "Submitted"}
                </span>
              </td>

              <td className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => onSelect(report)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Eye size={14} />
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
