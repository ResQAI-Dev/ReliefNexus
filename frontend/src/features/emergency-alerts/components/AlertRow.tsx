import React from "react";
import {
  Eye,
  Edit3,
  MapPin,
  Calendar,
} from "lucide-react";

import type { EmergencyAlert } from "../types/emergencyAlert";
import {
  getSeverityConfig,
  getStatusConfig,
  getDisasterIcon,
  formatDateTime,
} from "../utils/alertUtils";

/*
 * Agent 04 usage:
 *   <AlertRow
 *      alert={alert}
 *      onView={...}
 *      onUpdateStatus={...}
 *   />
 *
 * Existing UserDashboard usage:
 *   <AlertRow
 *      type={...}
 *      title={...}
 *      location={...}
 *      time={...}
 *   />
 *
 * Both usages are intentionally supported.
 */

interface AlertRowProps {
  alert?: EmergencyAlert;

  onView?: (alert: EmergencyAlert) => void;
  onUpdateStatus?: (alert: EmergencyAlert) => void;

  /* Existing dashboard props */
  type?: "danger" | "warning" | "info";
  title?: string;
  location?: string;
  time?: string;
}

export const AlertRow: React.FC<AlertRowProps> = ({
  alert,
  onView,
  onUpdateStatus,
  type,
  title,
  location,
  time,
}) => {

  /*
   * EXISTING DASHBOARD MODE
   *
   * Do not break UserDashboard.
   */
  if (!alert) {
    const typeClass =
      type === "danger"
        ? "bg-red-100 text-red-700"
        : type === "warning"
        ? "bg-orange-100 text-orange-700"
        : "bg-blue-100 text-blue-700";

    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeClass}`}
        >
          <span className="text-sm font-bold">
            !
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {title || "Emergency Alert"}
          </p>

          {location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </p>
          )}

          {time && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar className="h-3 w-3" />
              {time}
            </p>
          )}
        </div>
      </div>
    );
  }

  /*
   * AGENT 04 MODE
   */
  const severity =
    getSeverityConfig(alert.severity);

  const status =
    getStatusConfig(alert.status);

  const DisasterIcon =
    getDisasterIcon(alert.disasterType);

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50">

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">

          <div
            className={`rounded-xl p-2 ${severity.iconBg}`}
          >
            <DisasterIcon
              className={`h-5 w-5 ${severity.iconColor}`}
            />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {alert.title}
            </p>

            <p className="max-w-[300px] truncate text-xs text-slate-500">
              {alert.message}
            </p>
          </div>

        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <MapPin className="h-4 w-4 text-blue-500" />
          {alert.location}
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {alert.disasterType}
      </td>

      <td className="px-5 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${severity.badgeColor}`}
        >
          {alert.severity}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${status.badgeColor}`}
        >
          {alert.status}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          {formatDateTime(alert.createdAt)}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">

          <button
            onClick={() => onView?.(alert)}
            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
            title="View Alert"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={() => onUpdateStatus?.(alert)}
            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
            title="Update Status"
          >
            <Edit3 className="h-4 w-4" />
          </button>

        </div>
      </td>

    </tr>
  );
};

export default AlertRow;
