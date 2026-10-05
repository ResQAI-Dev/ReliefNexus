import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import type { DisasterReport } from "../types/disasterReports.types";

type Props = {
  report: DisasterReport;
};

const steps = [
  {
    key: "Submitted",
    label: "Submitted",
  },
  {
    key: "UnderReview",
    label: "Review",
  },
  {
    key: "Verified",
    label: "Verified",
  },
  {
    key: "Assigned",
    label: "Assigned",
  },
  {
    key: "InProgress",
    label: "Response",
  },
  {
    key: "FieldCompleted",
    label: "Completed",
  },
  {
    key: "Resolved",
    label: "Resolved",
  },
];

const order: Record<string, number> = {
  Submitted: 0,
  UnderReview: 1,
  Reviewed: 1,
  Verified: 2,
  VolunteerQueue: 2,
  Assigned: 3,
  Response: 4,
  InProgress: 4,
  FieldUpdateSubmitted: 4,
  FieldCompleted: 5,
  Resolved: 6,
  Rejected: -1,
};

export default function DisasterReportWorkflow({
  report,
}: Props) {
  const current = report.status || "Submitted";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
            Response Workflow
          </p>

          <h3 className="mt-1 text-base font-black text-slate-950">
            Report progress
          </h3>
        </div>

        {current === "Rejected" ? (
          <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
            Rejected
          </span>
        ) : (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
            {current}
          </span>
        )}
      </div>

      {current === "Rejected" ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <CircleAlert className="text-red-600" size={20} />
          <div>
            <p className="text-sm font-bold text-red-800">
              This disaster report was rejected.
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              The operational response workflow has ended.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-7">
          {steps.map((step, index) => {
            const complete =
              order[current] >= order[step.key];

            const active =
              current === step.key ||
              (step.key === "Verified" &&
                current === "VolunteerQueue") ||
              (step.key === "InProgress" &&
                current === "FieldUpdateSubmitted");

            return (
              <div
                key={step.key}
                className="relative"
              >
                <div
                  className={[
                    "rounded-xl border p-3 transition",
                    complete
                      ? "border-blue-100 bg-blue-50"
                      : "border-slate-100 bg-slate-50",
                    active
                      ? "ring-2 ring-blue-200"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    {complete ? (
                      <CheckCircle2
                        size={16}
                        className="text-blue-600"
                      />
                    ) : (
                      <Clock3
                        size={16}
                        className="text-slate-400"
                      />
                    )}

                    <span
                      className={[
                        "text-[10px] font-black uppercase tracking-wider",
                        complete
                          ? "text-blue-700"
                          : "text-slate-400",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden md:block" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {report.assignedVolunteerName && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <UserRoundCheck
            size={20}
            className="text-emerald-600"
          />

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
              Assigned Field Volunteer
            </p>

            <p className="mt-0.5 text-sm font-black text-emerald-900">
              {report.assignedVolunteerName}
            </p>
          </div>
        </div>
      )}

      {report.verifiedAt && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck size={15} className="text-blue-500" />
          Verified at{" "}
          {new Date(report.verifiedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
