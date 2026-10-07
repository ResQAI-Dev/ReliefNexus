import { useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  Flame,
  Globe2,
  Mountain,
  Snowflake,
  Sun,
  Thermometer,
  TriangleAlert,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

import type {
  DisasterRisk,
  RiskLevel,
} from "../types/riskPrediction.types";

interface Props {
  risks: DisasterRisk[];
}

type FilterKey = "all" | "high" | "medium" | "low" | "nodata";

type RiskIcon = ComponentType<{ className?: string }>;

const EXPECTED_RISKS = [
  "Flood",
  "Landslide",
  "Storm / Cyclone",
  "Drought",
  "Wildfire / Forest Fire",
  "Earthquake",
  "Tsunami",
  "Lightning",
  "Heatwave",
  "Volcanic Eruption",
  "Avalanche",
  "Extreme Cold / Cold Wave",
];

const ICONS: Record<string, RiskIcon> = {
  flood: Waves,
  landslide: Mountain,
  "storm / cyclone": Wind,
  drought: Sun,
  wildfire: Flame,
  earthquake: Activity,
  tsunami: Waves,
  lightning: Zap,
  heatwave: Thermometer,
  volcanic: TriangleAlert,
  avalanche: Mountain,
  "extreme cold / cold wave": Snowflake,
  "wildfire / forest fire": Flame,
  "volcanic eruption": TriangleAlert,
};

function normalize(value?: string) {
  return String(value ?? "").trim().toLowerCase();
}

function iconFor(type?: string): RiskIcon {
  const key = normalize(type);
  return ICONS[key] ?? TriangleAlert;
}

function numericRiskScore(risk?: DisasterRisk): number {
  const score = Number(risk?.riskScore);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}

function levelFor(risk?: DisasterRisk): string {
  const score = numericRiskScore(risk);

  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function toneFor(level: string) {
  switch (level) {
    case "Critical":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        bar: "bg-red-500",
        icon: "bg-red-50 text-red-600",
        value: "text-red-600",
      };
    case "High":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        bar: "bg-orange-500",
        icon: "bg-orange-50 text-orange-600",
        value: "text-orange-600",
      };
    case "Medium":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        bar: "bg-amber-500",
        icon: "bg-amber-50 text-amber-600",
        value: "text-amber-600",
      };
    case "Low":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        bar: "bg-emerald-500",
        icon: "bg-emerald-50 text-emerald-600",
        value: "text-slate-950",
      };
    default:
      return {
        badge: "border-slate-200 bg-slate-50 text-slate-500",
        bar: "bg-slate-300",
        icon: "bg-slate-50 text-slate-400",
        value: "text-slate-400",
      };
  }
}

export default function DisasterRiskGrid({ risks }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const displayedRisks = useMemo(() => {
    return EXPECTED_RISKS.map((expectedType) => {
      const expected = normalize(expectedType);

      const match =
        risks.find((risk) => normalize(risk.disasterType) === expected) ??
        risks.find((risk) => {
          const current = normalize(risk.disasterType);
          return current.includes(expected) || expected.includes(current);
        });

      return (
        match ?? {
          disasterType: expectedType,
          riskScore: 0,
          riskLevel: "Low" as RiskLevel,
          dataAvailable: false,
          dataSource: "No qualifying source data",
        }
      );
    }).map((risk) => ({
      ...risk,
      riskScore: numericRiskScore(risk),
      riskLevel: levelFor(risk),
      dataAvailable: risk.dataAvailable === true,
    }));
  }, [risks]);

  const counts = useMemo(() => {
    const summary = {
      all: displayedRisks.length,
      high: 0,
      medium: 0,
      low: 0,
      nodata: 0,
    };

    displayedRisks.forEach((risk) => {
      const level = levelFor(risk);

      if (level === "High" || level === "Critical") summary.high += 1;
      else if (level === "Medium") summary.medium += 1;
      else summary.low += 1;

      if (!risk.dataAvailable) summary.nodata += 1;
    });

    return summary;
  }, [displayedRisks]);

  const scoredRisks = displayedRisks
    .filter((risk) => Number.isFinite(Number(risk.riskScore)))
    .sort((a, b) => numericRiskScore(b) - numericRiskScore(a));

  const sourceBackedRisks = displayedRisks
    .filter((risk) => risk.dataAvailable === true && Number.isFinite(Number(risk.riskScore)))
    .sort(
      (a, b) =>
        Number(b.riskScore ?? 0) - Number(a.riskScore ?? 0)
    );

  const primaryType =
    sourceBackedRisks[0]?.disasterType ?? scoredRisks[0]?.disasterType;

  const visibleRisks = displayedRisks.filter((risk) => {
    const level = levelFor(risk);

    if (filter === "high") return level === "High" || level === "Critical";
    if (filter === "medium") return level === "Medium";
    if (filter === "low") return level === "Low";
    if (filter === "nodata") return !risk.dataAvailable;

    return true;
  });

  const coverage =
    displayedRisks.length > 0
      ? Math.round((scoredRisks.length / displayedRisks.length) * 100)
      : 0;

  return (
    <section className="w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,35,65,0.07)]">
      {/* HEADER */}
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity className="h-4 w-4" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[13px] font-black text-slate-950">
                    All Disaster Risks
                  </h2>

                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-blue-700">
                    {displayedRisks.length} Risk Types
                  </span>
                </div>

                <p className="mt-1 text-[8px] font-medium leading-4 text-slate-400">
                  Multi-disaster risk portfolio with a numeric score for every hazard.
                </p>
              </div>
            </div>
          </div>

          {/* KPI STRIP */}
          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-[76px] rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[6px] font-black uppercase tracking-[0.14em] text-slate-400">
                Scored
              </p>
              <p className="mt-1 text-[13px] font-black text-slate-950">
                {scoredRisks.length}
              </p>
              <p className="text-[6px] font-semibold text-slate-400">
                of {displayedRisks.length}
              </p>
            </div>

            <div className="min-w-[76px] rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[6px] font-black uppercase tracking-[0.14em] text-slate-400">
                Highest
              </p>
              <p className="mt-1 text-[13px] font-black text-slate-950">
                {Number(scoredRisks[0]?.riskScore ?? 0).toFixed(1)}
              </p>
              <p className="truncate text-[6px] font-semibold text-slate-400">
                {scoredRisks[0]?.disasterType ?? "No scored risk"}
              </p>
            </div>

            <div className="min-w-[76px] rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[6px] font-black uppercase tracking-[0.14em] text-slate-400">
                Coverage
              </p>
              <p className="mt-1 text-[13px] font-black text-slate-950">
                {coverage}%
              </p>
              <p className="text-[6px] font-semibold text-slate-400">
                data availability
              </p>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", `All ${counts.all}`],
              ["high", `High ${counts.high}`],
              ["medium", `Medium ${counts.medium}`],
              ["low", `Low ${counts.low}`],
              ["nodata", `Baseline ${counts.nodata}`],
            ] as Array<[FilterKey, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg border px-2.5 py-1.5 text-[7px] font-black transition ${
                filter === key
                  ? "border-blue-200 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* RISK GRID */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleRisks.map((risk) => {
            const level = levelFor(risk);
            const tone = toneFor(level);
            const score = numericRiskScore(risk);
            const Icon = iconFor(risk.disasterType);
            const isPrimary =
              primaryType &&
              normalize(primaryType) === normalize(risk.disasterType);

            return (
              <article
                key={risk.disasterType}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-4 transition ${
                  isPrimary
                    ? "border-blue-200 shadow-[0_8px_24px_rgba(37,99,235,0.10)]"
                    : "border-slate-200 hover:border-blue-100 hover:shadow-sm"
                }`}
              >
                {/* primary accent */}
                {isPrimary && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-600" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate text-[9px] font-black text-slate-900">
                          {risk.disasterType}
                        </h3>

                        {isPrimary && (
                          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[5.5px] font-black uppercase tracking-wider text-blue-700">
                            Primary
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-[6.5px] font-medium text-slate-400">
                        {risk.dataSource || "Backend risk service"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[5.5px] font-black uppercase tracking-wide ${tone.badge}`}
                  >
                    {level}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-[23px] font-black tracking-tight ${tone.value}`}
                      >
                        {numericRiskScore(risk).toFixed(1)}
                      </span>

                      <span className="text-[7px] font-black text-slate-400">
                        / 100
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          risk.dataAvailable ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />

                      <span className="text-[6.5px] font-bold text-slate-400">
                        {risk.dataAvailable
                          ? "Live source data"
                          : "Numeric baseline"}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[72px] text-right">
                    <p className="text-[6px] font-black uppercase tracking-[0.13em] text-slate-300">
                      Risk score
                    </p>
                    <p className="mt-1 text-[7px] font-bold text-slate-400">
                      {numericRiskScore(risk).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${tone.bar}`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, score ?? 0)
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[6px] font-medium text-slate-400">
                    {risk.dataSource || "No source reported"}
                  </span>

                  <span className="shrink-0 text-[6px] font-black text-slate-300">
                    {Math.round(score)} / 100
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {visibleRisks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Globe2 className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[9px] font-black text-slate-700">
              No risks match this filter
            </p>
            <p className="mt-1 text-[7px] font-medium text-slate-400">
              Select another risk category to view the returned assessments.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER SUMMARY */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[6.5px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live source data
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
Numeric baseline
            </span>
          </div>

          <span className="text-[6.5px] font-black uppercase tracking-[0.13em] text-slate-300">
            Backend risk portfolio  12 numeric scores
          </span>
        </div>
      </div>
    </section>
  );
}



