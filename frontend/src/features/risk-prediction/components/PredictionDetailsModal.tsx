import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  DisasterRisk,
  RiskFactor,
  RiskPrediction,
} from "../types/riskPrediction.types";
import {
  approveRiskPrediction,
  rejectRiskPrediction,
} from "../services/riskPredictionApi";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Database,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Info,
  MapPin,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Users,
  Wind,
  X,
} from "lucide-react";

interface Props {
  prediction: RiskPrediction;
  onClose: () => void;
  onApprovalComplete?: (
    prediction: RiskPrediction,
    action: "approve" | "reject"
  ) => void;
}

type Tone = {
  badge: string;
  text: string;
  soft: string;
  bar: string;
  border: string;
  dot: string;
};

const FACTOR_COLORS = [
  "#2563eb",
  "#f97316",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#94a3b8",
];

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLevel(level?: string | null): string {
  const value = String(level ?? "").trim().toLowerCase();

  if (value.includes("critical")) return "Critical";
  if (value.includes("high")) return "High";
  if (value.includes("moderate") || value.includes("medium")) return "Moderate";
  if (value.includes("low")) return "Low";
  if (value.includes("unavailable") || value.includes("nodata")) return "No Data";

  return "Assessed";
}

function riskTone(level?: string | null): Tone {
  switch (normalizeLevel(level)) {
    case "Critical":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        text: "text-red-600",
        soft: "bg-red-50",
        bar: "bg-red-500",
        border: "border-red-200",
        dot: "bg-red-500",
      };
    case "High":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        text: "text-orange-600",
        soft: "bg-orange-50",
        bar: "bg-orange-500",
        border: "border-orange-200",
        dot: "bg-orange-500",
      };
    case "Moderate":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        text: "text-amber-600",
        soft: "bg-amber-50",
        bar: "bg-amber-500",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "Low":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        text: "text-emerald-600",
        soft: "bg-emerald-50",
        bar: "bg-emerald-500",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    default:
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-600",
        text: "text-slate-500",
        soft: "bg-slate-50",
        bar: "bg-slate-400",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

function hazardIcon(type?: string): ReactNode {
  const value = String(type ?? "").toLowerCase();

  if (value.includes("flood") || value.includes("drought")) {
    return <CloudRain className="h-4 w-4 text-blue-500" />;
  }

  if (value.includes("wildfire") || value.includes("forest fire")) {
    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  }

  if (value.includes("storm") || value.includes("cyclone")) {
    return <Radar className="h-4 w-4 text-indigo-500" />;
  }

  if (value.includes("earthquake")) {
    return <Activity className="h-4 w-4 text-purple-500" />;
  }

  if (value.includes("landslide")) {
    return <Globe2 className="h-4 w-4 text-amber-600" />;
  }

  if (value.includes("tsunami")) {
    return <CloudRain className="h-4 w-4 text-cyan-500" />;
  }

  if (value.includes("lightning")) {
    return <Wind className="h-4 w-4 text-yellow-500" />;
  }

  if (value.includes("heatwave") || value.includes("heat")) {
    return <Thermometer className="h-4 w-4 text-red-500" />;
  }

  if (value.includes("volcanic") || value.includes("eruption")) {
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  }

  if (value.includes("avalanche")) {
    return <AlertTriangle className="h-4 w-4 text-slate-500" />;
  }

  if (value.includes("cold") || value.includes("wave")) {
    return <Wind className="h-4 w-4 text-cyan-500" />;
  }

  return <AlertTriangle className="h-4 w-4 text-slate-400" />;
}

function disasterPhoto(type?: string): string {
  const value = String(type ?? "").toLowerCase();

  if (value.includes("flood")) return "/assets/disasters/flood.jpg";
  if (value.includes("drought")) return "/assets/disasters/drought.jpg";
  if (value.includes("cyclone") || value.includes("storm")) return "/assets/disasters/cyclone.jpg";
  if (value.includes("earthquake")) return "/assets/disasters/earthquake.jpg";
  if (value.includes("landslide")) return "/assets/disasters/landslide.jpg";
  if (value.includes("wildfire") || value.includes("forest fire")) return "/assets/disasters/wildfire.jpg";
  if (value.includes("tsunami")) return "/assets/disasters/tsunami.jpg";
  if (value.includes("lightning")) return "/assets/disasters/lightning.jpg";
  if (value.includes("heatwave") || value.includes("heat")) return "/assets/disasters/heatstorm.jpg";

  return "/assets/disasters/flood.jpg";
}

function formatDate(value?: string): string {
  if (!value) return "Not available";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: unknown): string {
  const n = Number(value);

  if (!Number.isFinite(n)) return "N/A";

  return n.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function fixed(value: unknown, digits = 1): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
}

function factorTone(impact?: string): string {
  const value = String(impact ?? "").toLowerCase();

  if (value.includes("critical") || value.includes("very high")) {
    return "text-red-600";
  }

  if (value.includes("high")) return "text-orange-600";
  if (value.includes("moderate") || value.includes("medium")) {
    return "text-amber-600";
  }

  return "text-emerald-600";
}

function buildMapUrl(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) {
    return "";
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${(
    lon - 0.08
  ).toFixed(5)}%2C${(lat - 0.06).toFixed(5)}%2C${(lon + 0.08).toFixed(
    5
  )}%2C${(lat + 0.06).toFixed(
    5
  )}&layer=mapnik&marker=${lat}%2C${lon}`;
}


function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadBlob(
  content: string | Uint8Array<ArrayBufferLike>,
  filename: string,
  mimeType: string
): void {
  // Create an ArrayBuffer-backed copy so typed arrays whose buffer is
  // ArrayBufferLike (for example, SharedArrayBuffer) satisfy BlobPart.
  const blobContent: BlobPart =
    typeof content === "string"
      ? content
      : new Uint8Array(content).buffer as ArrayBuffer;
  const blob = new Blob([blobContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function pdfSafe(value: unknown): string {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfEscape(value: unknown): string {
  return pdfSafe(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfWrap(value: unknown, maxChars = 82): string[] {
  const text = pdfSafe(value);

  if (!text) return [""];
  if (text.length <= maxChars) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;

    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);

  return lines;
}

function buildRiskCsv(prediction: RiskPrediction): string {
  const primaryRisk =
    (prediction.disasterRisks ?? [])
      .filter(
        (risk) =>
          risk.dataAvailable &&
          risk.riskScore !== null &&
          risk.riskScore !== undefined
      )
      .sort(
        (a, b) => Number(b.riskScore ?? 0) - Number(a.riskScore ?? 0)
      )[0] ?? null;

  const rows: string[][] = [
    ["ReliefNexus Risk Prediction Export"],
    ["Exported At", new Date().toISOString()],
    [],
    ["Assessment", ""],
    ["Prediction ID", prediction.id],
    ["Location", prediction.location],
    ["Latitude", String(prediction.latitude ?? "")],
    ["Longitude", String(prediction.longitude ?? "")],
    ["Primary Hazard", primaryRisk?.disasterType || prediction.disasterType || ""],
    ["Risk Score", String(primaryRisk?.riskScore ?? prediction.riskScore ?? "")],
    ["Risk Level", String(primaryRisk?.riskLevel ?? prediction.riskLevel ?? "")],
    ["Confidence", String(prediction.confidence ?? "")],
    ["Approval Status", prediction.approvalStatus || (prediction.requiresHumanApproval ? "Pending" : "Not Required")],
    ["Requires Human Approval", String(prediction.requiresHumanApproval)],
    ["Is Approved", String(prediction.isApproved)],
    ["Prediction Source", prediction.predictionSource || ""],
    ["Model Version", prediction.modelVersion || ""],
    ["Created At", prediction.createdAt || ""],
    [],
    ["Hazard Portfolio"],
    ["Rank", "Disaster Type", "Risk Score", "Risk Level", "Data Available", "Data Source"],
  ];

  (prediction.disasterRisks ?? [])
    .slice()
    .sort((a, b) => Number(b.riskScore ?? 0) - Number(a.riskScore ?? 0))
    .forEach((risk, index) => {
      rows.push([
        String(index + 1),
        risk.disasterType,
        String(risk.riskScore ?? ""),
        String(risk.riskLevel ?? ""),
        String(risk.dataAvailable),
        risk.dataSource || "",
      ]);
    });

  rows.push([]);
  rows.push(["Risk Factors"]);
  rows.push(["Rank", "Factor", "Value", "Impact", "Contribution"]);

  (prediction.riskFactors ?? [])
    .slice()
    .sort((a, b) => Number(b.contribution ?? 0) - Number(a.contribution ?? 0))
    .forEach((factor, index) => {
      rows.push([
        String(index + 1),
        factor.factor,
        String(factor.value ?? ""),
        factor.impact || "",
        String(factor.contribution ?? ""),
      ]);
    });

  rows.push([]);
  rows.push(["Environmental Context"]);
  rows.push(["Field", "Value", "Unit"]);
  rows.push(["Rainfall 1h", String(prediction.rainfall1h ?? ""), "mm"]);
  rows.push(["Rainfall 3h", String(prediction.rainfall3h ?? ""), "mm"]);
  rows.push(["Rainfall 24h", String(prediction.rainfall24h ?? ""), "mm"]);
  rows.push(["Forecast Rainfall", String(prediction.forecastRainfall ?? ""), "mm"]);
  rows.push(["Temperature", String(prediction.temperature ?? ""), "deg C"]);
  rows.push(["Humidity", String(prediction.humidity ?? ""), "%"]);
  rows.push(["Wind Speed", String(prediction.windSpeed ?? ""), "km/h"]);
  rows.push(["Soil Moisture", String(prediction.soilMoisture ?? ""), "%"]);
  rows.push(["River Level", String(prediction.riverLevel ?? ""), "m"]);
  rows.push(["River Flow", String(prediction.riverFlow ?? ""), "m3/s"]);
  rows.push(["Population Density", String(prediction.populationDensity ?? ""), "/km2"]);
  rows.push(["Elevation", String(prediction.elevation ?? ""), "m"]);
  rows.push(["Historical Event Count", String(prediction.historicalFloodCount ?? ""), ""]);
  rows.push(["Historical Severity", String(prediction.historicalSeverity ?? ""), ""]);
  rows.push(["Drainage Capacity", String(prediction.drainageCapacity ?? ""), ""]);

  rows.push([]);
  rows.push(["Recommendations"]);
  (prediction.recommendations ?? []).forEach((recommendation, index) => {
    rows.push([String(index + 1), recommendation]);
  });

  return rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");
}

function pdfText(x: number, y: number, size: number, text: string, color = "0.12 0.18 0.28"): string {
  return `BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function pdfRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  radius = false
): string {
  if (radius) {
    return `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
  }

  return `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
}

function buildRiskPdf(prediction: RiskPrediction): Uint8Array {
  const width = 595;
  const height = 842;
  const margin = 36;
  const pages: string[] = [];
  let commands: string[] = [];
  let y = height - margin;

  const push = (command: string) => {
    commands.push(command);
  };

  const ensureSpace = (needed = 32) => {
    if (y < margin + needed) {
      pages.push(commands.join("\n"));
      commands = [];
      y = height - margin;
    }
  };
  const location = prediction.location || "Unknown location";
  const primary =
    (prediction.disasterRisks ?? [])
      .filter(
        (risk) =>
          risk.dataAvailable &&
          risk.riskScore !== null &&
          risk.riskScore !== undefined
      )
      .sort(
        (a, b) => Number(b.riskScore ?? 0) - Number(a.riskScore ?? 0)
      )[0] ?? null;

  const primaryType = primary?.disasterType || prediction.disasterType || "Risk Assessment";
  const primaryScore = Number(primary?.riskScore ?? prediction.riskScore ?? 0);
  const primaryLevel = String(primary?.riskLevel ?? prediction.riskLevel ?? "Unknown");
  const confidence = Number(prediction.confidence ?? 0);

  // Cover / executive summary
  push(pdfRect(margin, height - 168, width - margin * 2, 118, "0.04 0.10 0.20"));
  push(pdfText(margin + 18, height - 78, 9, "RELIEFNEXUS | AGENT 01", "0.55 0.75 1"));
  push(pdfText(margin + 18, height - 108, 22, "Risk Prediction Intelligence Report", "1 1 1"));
  push(pdfText(margin + 18, height - 129, 9, `${location} | ${formatDate(prediction.createdAt)}`, "0.82 0.88 0.96"));

  y = height - 190;

  push(pdfText(margin, y, 9, "EXECUTIVE SUMMARY", "0.13 0.37 0.75"));
  y -= 22;

  const scoreColor =
    primaryScore >= 80 ? "0.86 0.10 0.17"
      : primaryScore >= 60 ? "0.95 0.35 0.08"
        : primaryScore >= 40 ? "0.94 0.58 0.05"
          : "0.05 0.65 0.40";

  push(pdfRect(margin, y - 76, 160, 76, "0.96 0.98 1"));
  push(pdfText(margin + 14, y - 20, 8, "PRIMARY RISK", "0.38 0.45 0.56"));
  push(pdfText(margin + 14, y - 47, 28, primaryScore.toFixed(1), scoreColor));
  push(pdfText(margin + 86, y - 47, 9, "/100", "0.38 0.45 0.56"));
  push(pdfText(margin + 14, y - 64, 8, `${primaryType} | ${primaryLevel}`, scoreColor));

  push(pdfRect(margin + 174, y - 76, 170, 76, "0.97 0.97 1"));
  push(pdfText(margin + 188, y - 20, 8, "CONFIDENCE", "0.38 0.45 0.56"));
  push(pdfText(margin + 188, y - 48, 23, `${confidence.toFixed(0)}%`, "0.10 0.35 0.72"));
  push(pdfText(margin + 188, y - 65, 8, prediction.predictionSource || "Backend Risk Prediction Service", "0.38 0.45 0.56"));

  push(pdfRect(margin + 358, y - 76, 165, 76, "0.98 0.97 0.94"));
  push(pdfText(margin + 372, y - 20, 8, "GOVERNANCE", "0.53 0.43 0.16"));
  push(pdfText(margin + 372, y - 48, 14, prediction.requiresHumanApproval ? (prediction.isApproved ? "Approved" : "Pending") : "Not Required", "0.53 0.43 0.16"));
  push(pdfText(margin + 372, y - 65, 8, prediction.modelVersion || "Model version not specified", "0.38 0.45 0.56"));

  y -= 100;

  // Helper to add a section
  const section = (sectionTitle: string) => {
    ensureSpace(70);
    push(pdfRect(margin, y - 24, width - margin * 2, 24, "0.93 0.96 1"));
    push(pdfText(margin + 10, y - 16, 9, sectionTitle.toUpperCase(), "0.10 0.36 0.72"));
    y -= 42;
  };

  const row = (label: string, value: string) => {
    const lines = pdfWrap(value, 66);
    ensureSpace(24 + lines.length * 14);

    push(pdfText(margin, y, 8, label, "0.45 0.50 0.58"));
    let valueY = y;
    lines.forEach((line) => {
      push(pdfText(margin + 150, valueY, 8, line, "0.12 0.18 0.28"));
      valueY -= 12;
    });
    y = valueY - 4;
  };

  section("Assessment Metadata");
  row("Prediction ID", prediction.id);
  row("Location", location);
  row("Coordinates", `${prediction.latitude ?? "N/A"}, ${prediction.longitude ?? "N/A"}`);
  row("Primary hazard", `${primaryType} | ${primaryScore.toFixed(1)}/100 | ${primaryLevel}`);
  row("Confidence", `${confidence.toFixed(0)}%`);
  row("Source", prediction.predictionSource || "Backend Risk Prediction Service");
  row("Model version", prediction.modelVersion || "Not specified");
  row("Approval", prediction.requiresHumanApproval ? (prediction.isApproved ? "Approved" : prediction.approvalStatus || "Pending") : "Not Required");

  section("Multi-Hazard Portfolio");
  (prediction.disasterRisks ?? [])
    .slice()
    .sort((a, b) => Number(b.riskScore ?? 0) - Number(a.riskScore ?? 0))
    .forEach((risk, index) => {
      const score = risk.riskScore === null || risk.riskScore === undefined ? "N/A" : Number(risk.riskScore).toFixed(1);
      row(`${index + 1}. ${risk.disasterType}`, `${score}/100 | ${risk.riskLevel || "N/A"} | ${risk.dataAvailable ? risk.dataSource || "Data available" : "Data unavailable"}`);
    });

  section("Environmental Context");
  row("Rainfall 1h", `${fixed(prediction.rainfall1h)} mm`);
  row("Rainfall 3h", `${fixed(prediction.rainfall3h)} mm`);
  row("Rainfall 24h", `${fixed(prediction.rainfall24h)} mm`);
  row("Forecast rainfall", `${fixed(prediction.forecastRainfall)} mm`);
  row("Temperature", `${fixed(prediction.temperature)} deg C`);
  row("Humidity", `${fixed(prediction.humidity, 0)}%`);
  row("Wind speed", `${fixed(prediction.windSpeed)} km/h`);
  row("Soil moisture", `${fixed(prediction.soilMoisture)}%`);
  row("River level", `${fixed(prediction.riverLevel)} m`);
  row("River flow", `${fixed(prediction.riverFlow)} m3/s`);
  row("Population density", `${formatNumber(prediction.populationDensity)} /km2`);
  row("Elevation", `${fixed(prediction.elevation, 0)} m`);
  row("Historical events", formatNumber(prediction.historicalFloodCount));
  row("Historical severity", formatNumber(prediction.historicalSeverity));
  row("Drainage capacity", fixed(prediction.drainageCapacity));

  section("Risk Factor Contributions");
  (prediction.riskFactors ?? [])
    .slice()
    .sort((a, b) => Number(b.contribution ?? 0) - Number(a.contribution ?? 0))
    .forEach((factor, index) => {
      row(
        `${index + 1}. ${factor.factor}`,
        `Value ${formatNumber(factor.value)} | Contribution ${formatNumber(factor.contribution)} | ${factor.impact || "Impact not specified"}`
      );
    });

  section("Recommendations");
  if ((prediction.recommendations ?? []).length === 0) {
    row("Status", "No recommendations were returned by the prediction service.");
  } else {
    (prediction.recommendations ?? []).forEach((recommendation, index) => {
      row(`Action ${index + 1}`, recommendation);
    });
  }

  section("Report Footer");
  row("Generated", new Date().toISOString());
  row("Record created", prediction.createdAt);
  row("Export format", "ReliefNexus operational risk report (PDF)");

  pages.push(commands.join("\n"));

  // Construct a valid, dependency-free PDF 1.4 file.
  const objects: Record<number, string> = {};
  const pageCount = pages.length;
  const firstPageObject = 4;
  const firstContentObject = 4 + pageCount;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] =
    `<< /Type /Pages /Kids [${Array.from(
      { length: pageCount },
      (_, index) => `${firstPageObject + index} 0 R`
    ).join(" ")}] /Count ${pageCount} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((content, index) => {
    const pageObject = firstPageObject + index;
    const contentObject = firstContentObject + index;
    const contentBytes = new TextEncoder().encode(content).length;

    objects[pageObject] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;

    objects[contentObject] =
      `<< /Length ${contentBytes} >>\nstream\n${content}\nendstream`;
  });

  const maxObject = 3 + pageCount * 2;
  let pdf = "%PDF-1.4\n%ReliefNexus\n";
  const offsets = new Array<number>(maxObject + 1).fill(0);
  const encoder = new TextEncoder();

  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber += 1) {
    offsets[objectNumber] = encoder.encode(pdf).length;
    pdf += `${objectNumber} 0 obj\n${objects[objectNumber]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;

  pdf += `xref\n0 ${maxObject + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber += 1) {
    pdf += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export default function PredictionDetailsModal({
  prediction,
  onClose,
  onApprovalComplete,
}: Props) {
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !approvalLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approvalLoading, onClose]);

  const disasterRisks = useMemo<DisasterRisk[]>(
    () => prediction.disasterRisks ?? [],
    [prediction.disasterRisks]
  );

  const riskFactors = useMemo<RiskFactor[]>(
    () => prediction.riskFactors ?? [],
    [prediction.riskFactors]
  );

  const recommendations = useMemo(
    () => prediction.recommendations ?? [],
    [prediction.recommendations]
  );

  const rankedRisks = useMemo(
    () =>
      [...disasterRisks].sort(
        (a, b) => safeNumber(b.riskScore) - safeNumber(a.riskScore)
      ),
    [disasterRisks]
  );

  const availableRisks = useMemo(
    () =>
      rankedRisks.filter(
        (risk) =>
          risk.dataAvailable === true &&
          risk.riskScore !== null &&
          risk.riskScore !== undefined &&
          Number.isFinite(Number(risk.riskScore))
      ),
    [rankedRisks]
  );

  const primaryRisk =
    availableRisks[0] ??
    ({
      disasterType: prediction.disasterType || "Risk Assessment",
      riskScore: prediction.riskScore ?? 0,
      riskLevel: prediction.riskLevel || "DataUnavailable",
      dataAvailable: false,
      dataSource: prediction.predictionSource || "",
    } as DisasterRisk);

  const secondaryRisk = availableRisks[1];

  const primaryType =
    String(primaryRisk.disasterType || prediction.disasterType || "Risk Assessment").trim();

  const primaryScore = safeNumber(primaryRisk.riskScore);
  const primaryLevel = primaryRisk.riskLevel || prediction.riskLevel;
  const tone = riskTone(primaryLevel);

  const confidence = clamp(safeNumber(prediction.confidence));
  const totalHazards = disasterRisks.length;
  const availableHazards = availableRisks.length;
  const elevatedHazards = availableRisks.filter(
    (item) => safeNumber(item.riskScore) >= 60
  ).length;

  const totalAvailableScore = availableRisks.reduce(
    (sum, item) => sum + safeNumber(item.riskScore),
    0
  );

  const primaryDominance =
    totalAvailableScore > 0
      ? (primaryScore / totalAvailableScore) * 100
      : 0;

  const separation =
    secondaryRisk !== undefined
      ? primaryScore - safeNumber(secondaryRisk.riskScore)
      : null;

  const topFactors = useMemo(
    () =>
      [...riskFactors]
        .sort(
          (a, b) =>
            safeNumber(b.contribution) - safeNumber(a.contribution)
        )
        .slice(0, 8),
    [riskFactors]
  );

  const factorContributionTotal = topFactors.reduce(
    (sum, item) => sum + Math.max(0, safeNumber(item.contribution)),
    0
  );

  const inputFields = [
    ["Rainfall 1h", prediction.rainfall1h, "mm"],
    ["Rainfall 3h", prediction.rainfall3h, "mm"],
    ["Rainfall 24h", prediction.rainfall24h, "mm"],
    ["Forecast rainfall", prediction.forecastRainfall, "mm"],
    ["Temperature", prediction.temperature, "C"],
    ["Humidity", prediction.humidity, "%"],
    ["Wind speed", prediction.windSpeed, "km/h"],
    ["Soil moisture", prediction.soilMoisture, "%"],
    ["River level", prediction.riverLevel, "m"],
    ["River flow", prediction.riverFlow, "m3/s"],
    ["Population density", prediction.populationDensity, "/km2"],
    ["Elevation", prediction.elevation, "m"],
    ["Historical events", prediction.historicalFloodCount, ""],
    ["Historical severity", prediction.historicalSeverity, ""],
    ["Drainage capacity", prediction.drainageCapacity, ""],
  ] as const;

  const populatedInputs = inputFields.filter(([, value]) =>
    Number.isFinite(Number(value))
  ).length;

  const inputCoverage = inputFields.length
    ? (populatedInputs / inputFields.length) * 100
    : 0;

  const strongestFactor = topFactors[0];

  const signalWatch = useMemo(() => {
    const type = primaryType.toLowerCase();

    if (type.includes("drought")) {
      return [
        {
          label: "Rainfall",
          value: `${fixed(prediction.rainfall24h)} mm / 24h`,
          note: "Track rainfall deficit and short-range precipitation.",
          icon: <CloudRain className="h-3.5 w-3.5" />,
        },
        {
          label: "Forecast rainfall",
          value: `${fixed(prediction.forecastRainfall)} mm`,
          note: "Lower forecast rainfall may increase drought pressure.",
          icon: <CloudRain className="h-3.5 w-3.5" />,
        },
        {
          label: "Soil moisture",
          value: `${fixed(prediction.soilMoisture)}%`,
          note: "Monitor moisture conditions together with rainfall.",
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: "Heat / humidity",
          value: `${fixed(prediction.temperature)} C Â· ${fixed(
            prediction.humidity,
            0
          )}%`,
          note: "Thermal and humidity conditions provide additional context.",
          icon: <Thermometer className="h-3.5 w-3.5" />,
        },
      ];
    }

    if (type.includes("flood")) {
      return [
        {
          label: "Rainfall",
          value: `${fixed(prediction.rainfall24h)} mm / 24h`,
          note: "Monitor accumulated rainfall.",
          icon: <CloudRain className="h-3.5 w-3.5" />,
        },
        {
          label: "River level",
          value: `${fixed(prediction.riverLevel)} m`,
          note: "Monitor current river-level pressure.",
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: "River flow",
          value: `${fixed(prediction.riverFlow)} m3/s`,
          note: "Use flow readings as an additional hydrological signal.",
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: "Forecast",
          value: `${fixed(prediction.forecastRainfall)} mm`,
          note: "Compare near-term forecast with accumulated rainfall.",
          icon: <CloudRain className="h-3.5 w-3.5" />,
        },
      ];
    }

    if (type.includes("landslide")) {
      return [
        {
          label: "Rainfall",
          value: `${fixed(prediction.rainfall24h)} mm / 24h`,
          note: "Rainfall is a key environmental context signal.",
          icon: <CloudRain className="h-3.5 w-3.5" />,
        },
        {
          label: "Soil moisture",
          value: `${fixed(prediction.soilMoisture)}%`,
          note: "Track saturation conditions.",
          icon: <Activity className="h-3.5 w-3.5" />,
        },
        {
          label: "Elevation",
          value: `${fixed(prediction.elevation, 0)} m`,
          note: "Terrain context for the assessment.",
          icon: <Globe2 className="h-3.5 w-3.5" />,
        },
        {
          label: "Wind",
          value: `${fixed(prediction.windSpeed)} km/h`,
          note: "Supporting environmental signal.",
          icon: <Wind className="h-3.5 w-3.5" />,
        },
      ];
    }

    return [
      {
        label: "Temperature",
        value: `${fixed(prediction.temperature)} C`,
        note: "Current thermal context.",
        icon: <Thermometer className="h-3.5 w-3.5" />,
      },
      {
        label: "Humidity",
        value: `${fixed(prediction.humidity, 0)}%`,
        note: "Current humidity context.",
        icon: <Activity className="h-3.5 w-3.5" />,
      },
      {
        label: "Wind speed",
        value: `${fixed(prediction.windSpeed)} km/h`,
        note: "Current wind context.",
        icon: <Wind className="h-3.5 w-3.5" />,
      },
      {
        label: "Population",
        value: `${formatNumber(prediction.populationDensity)} /km2`,
        note: "Exposure context available to the model.",
        icon: <Users className="h-3.5 w-3.5" />,
      },
    ];
  }, [
    prediction,
    primaryType,
  ]);

  const operationalPosture =
    normalizeLevel(primaryLevel) === "Critical"
      ? "Highest operational attention"
      : normalizeLevel(primaryLevel) === "High"
        ? "Priority operational attention"
        : normalizeLevel(primaryLevel) === "Moderate"
          ? "Enhanced monitoring"
          : normalizeLevel(primaryLevel) === "Low"
            ? "Routine monitoring"
            : "Assessment review required";

  const approvalState = !prediction.requiresHumanApproval
    ? "Not Required"
    : prediction.isApproved
      ? "Approved"
      : prediction.approvalStatus?.trim() || "Pending";


  const mapUrl = buildMapUrl(prediction.latitude, prediction.longitude);
  const openMapUrl =
    prediction.latitude !== null &&
    prediction.latitude !== undefined &&
    prediction.longitude !== null &&
    prediction.longitude !== undefined
      ? `https://www.openstreetmap.org/?mlat=${prediction.latitude}&mlon=${prediction.longitude}#map=12/${prediction.latitude}/${prediction.longitude}`
      : "";

  const heroImage = disasterPhoto(primaryType);

  const aiInsights = [
    {
      ok: Boolean(prediction.location),
      text: "Location and environmental context are attached to the prediction.",
    },
    {
      ok: availableHazards > 0,
      text: `${availableHazards} of ${totalHazards} returned hazards have usable risk scores.`,
    },
    {
      ok: primaryScore > 0,
      text: `${primaryType} is the highest validated hazard at ${primaryScore.toFixed(1)}.`,
    },
    {
      ok: Boolean(strongestFactor),
      text: strongestFactor
        ? `${strongestFactor.factor} is the strongest stored factor by contribution.`
        : "No structured risk-factor contribution was returned.",
    },
    {
      ok: confidence > 0,
      text: `${confidence.toFixed(0)}% prediction confidence is recorded.`,
    },
    {
      ok: inputCoverage >= 70,
      text: `${inputCoverage.toFixed(0)}% of tracked input fields contain numeric values.`,
    },
  ];


  const handleApproval = async (action: "approve" | "reject") => {
    if (!prediction.id || approvalLoading) return;

    setApprovalLoading(true);
    setApprovalError("");

    try {
      const updated =
        action === "approve"
          ? await approveRiskPrediction(prediction.id)
          : await rejectRiskPrediction(prediction.id);

      onApprovalComplete?.(updated, action);
      onClose();
    } catch (error) {
      setApprovalError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} this prediction.`
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (exporting) return;

    setExporting("csv");
    setExportStatus("");

    try {
      const csv = buildRiskCsv(prediction);
      const safeLocation = (prediction.location || "risk-assessment")
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      downloadBlob(
        csv,
        `reliefnexus-risk-${safeLocation || "assessment"}.csv`,
        "text/csv;charset=utf-8"
      );

      setExportStatus("CSV exported");
    } catch {
      setExportStatus("CSV export failed");
    } finally {
      window.setTimeout(() => {
        setExporting(null);
      }, 500);
    }
  };

  const handleExportPdf = () => {
    if (exporting) return;

    setExporting("pdf");
    setExportStatus("");

    try {
      const pdf = buildRiskPdf(prediction);
      const safeLocation = (prediction.location || "risk-assessment")
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      downloadBlob(
        pdf,
        `reliefnexus-risk-${safeLocation || "assessment"}.pdf`,
        "application/pdf"
      );

      setExportStatus("PDF exported");
    } catch {
      setExportStatus("PDF export failed");
    } finally {
      window.setTimeout(() => {
        setExporting(null);
      }, 500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-xl sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !approvalLoading) {
          onClose();
        }
      }}
    >
      <div
        className="flex h-[96vh] max-h-[1000px] w-full max-w-[1520px] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[#eef4f9] shadow-[0_40px_130px_rgba(2,16,38,.46)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HERO */}
        <header className="relative shrink-0 overflow-hidden bg-slate-950 text-white">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,12,26,.96)_0%,rgba(5,22,42,.82)_38%,rgba(5,22,42,.52)_72%,rgba(10,20,35,.32)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(59,130,246,.34),transparent_30%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

          <div className="relative px-5 py-4 sm:px-7 lg:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100 shadow-2xl backdrop-blur-xl">
                  <Radar className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[13px] font-black uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                      Risk Prediction Agent
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[13px] font-black uppercase ${tone.badge}`}
                    >
                      {normalizeLevel(primaryLevel)}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[13px] font-black text-emerald-100 backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                      Deep Analysis
                    </span>
                  </div>

                  <h2
                    id="prediction-details-title"
                    className="mt-2 text-[26px] font-black tracking-[-0.03em] sm:text-[32px]"
                  >
                    {primaryType} Risk Intelligence
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-white/65 sm:text-[12px]">
                    <span>{prediction.location || "Unknown location"}</span>
                    <span className="text-white/25">-</span>
                    <span>{formatDate(prediction.createdAt)}</span>
                  </div>

                  <p className="mt-2 max-w-3xl text-[13px] font-medium leading-4 text-white/55">
                    Multi-hazard operational assessment using the saved Agent 01 prediction record and its returned risk intelligence.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={approvalLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 backdrop-blur-md transition hover:bg-white/15 disabled:opacity-50"
                  aria-label="Close prediction details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* HERO KPIS */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <HeroKpi
                label="Current posture"
                value={primaryScore.toFixed(1)}
                detail={`${primaryType} / 100`}
                tone={normalizeLevel(primaryLevel)}
                ring
              />
              <HeroKpi
                label="Confidence"
                value={`${confidence.toFixed(0)}%`}
                detail="Model signal"
              />
              <HeroKpi
                label="Hazards analysed"
                value={String(totalHazards)}
                detail={`${availableHazards} with data`}
              />
              <HeroKpi
                label="Elevated hazards"
                value={String(elevatedHazards)}
                detail="Score â‰¥ 60"
              />
              <HeroKpi
                label="Input coverage"
                value={`${inputCoverage.toFixed(0)}%`}
                detail={`${populatedInputs}/${inputFields.length} fields`}
              />
              <HeroKpi
                label="Approval"
                value={approvalState}
                detail="Governance state"
              />
            </div>
          </div>
        </header>

        {/* BODY */}
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
        {exportStatus && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] font-black text-emerald-700">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {exportStatus}
            </span>
            <button
              type="button"
              onClick={() => setExportStatus("")}
              className="rounded-lg px-2 py-1 text-emerald-600 transition hover:bg-emerald-100"
              aria-label="Dismiss export status"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <section className="mb-3 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Download className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Export Center
                </p>
                <p className="mt-0.5 text-[12px] font-black text-slate-900">
                  Take this prediction offline
                </p>
              </div>
            </div>
            <p className="mt-1 text-[13px] font-semibold leading-4 text-slate-400">
              PDF creates a formatted operational report. CSV exports the assessment, hazard portfolio, factors, environmental inputs and recommendations.
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={Boolean(exporting)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-[13px] font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting === "pdf" ? "Generating PDF..." : "Export PDF"}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={Boolean(exporting)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 text-[13px] font-black text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" />
              {exporting === "csv" ? "Preparing CSV..." : "Export CSV"}
            </button>
          </div>
        </section>

          {/* MAP + PRIMARY + OPERATIONAL POSTURE */}
          <section className="grid gap-3 xl:grid-cols-[1.05fr_1fr_.88fr]">
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Location & Map
                  </p>
                  <h3 className="mt-1 text-[13px] font-black text-slate-900">
                    Real-world assessment area
                  </h3>
                  <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                    {prediction.location || "Selected location"}
                  </p>
                </div>

                {openMapUrl && (
                  <a
                    href={openMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-black text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View full map
                  </a>
                )}
              </div>

              <div className="relative m-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                {mapUrl ? (
                  <iframe
                    title={`Risk map for ${prediction.location || "assessment location"}`}
                    src={mapUrl}
                    className="h-[285px] w-full border-0 sm:h-[320px]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-[285px] items-center justify-center bg-slate-100">
                    <div className="text-center">
                      <MapPin className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-[12px] font-black text-slate-500">
                        Map unavailable
                      </p>
                      <p className="mt-1 text-[13px] text-slate-400">
                        Valid coordinates are required.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 text-white shadow-lg backdrop-blur-md">
                  <p className="text-[12px] font-black uppercase tracking-[0.16em] text-white/45">
                    Assessment coordinates
                  </p>
                  <p className="mt-0.5 text-[12px] font-black">
                    {prediction.latitude !== null &&
                    prediction.latitude !== undefined &&
                    prediction.longitude !== null &&
                    prediction.longitude !== undefined
                      ? `${fixed(prediction.latitude, 5)}, ${fixed(
                          prediction.longitude,
                          5
                        )}`
                      : "Not available"}
                  </p>
                </div>

                <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/95 px-2.5 py-1.5 text-[13px] font-black text-slate-700 shadow-lg">
                    OpenStreetMap
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1.5 text-[13px] font-black ${tone.badge}`}
                  >
                    {normalizeLevel(primaryLevel)} Â· {primaryScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Primary Prediction
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  {primaryType} assessment
                </h3>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                  Highest validated hazard currently available.
                </p>
              </div>

              <div className={`relative overflow-hidden p-4 ${tone.soft}`}>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[22px] border-white/50" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[13px] font-black ${tone.badge}`}
                      >
                        {normalizeLevel(primaryLevel)}
                      </span>
                    </div>

                    <p className={`mt-5 text-[52px] font-black leading-none ${tone.text}`}>
                      {primaryScore.toFixed(1)}
                    </p>
                    <p className="mt-1 text-[12px] font-black text-slate-400">
                      Risk score / 100
                    </p>
                  </div>

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/65 shadow-sm ring-1 ring-white/80">
                    <div className="text-center">
                      <p className={`text-[21px] font-black ${tone.text}`}>
                        {primaryScore.toFixed(0)}
                      </p>
                      <p className="text-[12px] font-black uppercase tracking-wider text-slate-400">
                        score
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/75">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${clamp(primaryScore)}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniMetric label="Confidence" value={`${confidence.toFixed(0)}%`} />
                  <MiniMetric
                    label="Location"
                    value={prediction.location || "Unknown"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3">
                <MiniMetric
                  label="Risk separation"
                  value={
                    separation !== null
                      ? `${separation >= 0 ? "+" : ""}${separation.toFixed(1)} pts`
                      : "N/A"
                  }
                />
                <MiniMetric
                  label="Next hazard"
                  value={
                    secondaryRisk
                      ? `${secondaryRisk.disasterType} Â· ${safeNumber(
                          secondaryRisk.riskScore
                        ).toFixed(1)}`
                      : "No secondary"
                  }
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Operational Posture
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Current response attention
                </h3>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                  Decision context from the saved prediction state.
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-black uppercase tracking-wider text-blue-600">
                      Recommended posture
                    </p>
                    <p className="mt-0.5 text-[12px] font-black text-slate-900">
                      {operationalPosture}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <MiniDetail
                    label="Confidence"
                    value={`${confidence.toFixed(0)}%`}
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  />
                  <MiniDetail
                    label="Source"
                    value={prediction.predictionSource || "Backend risk service"}
                    icon={<Database className="h-3.5 w-3.5" />}
                  />
                  <MiniDetail
                    label="Model"
                    value={prediction.modelVersion || "Not specified"}
                    icon={<Radar className="h-3.5 w-3.5" />}
                  />
                  <MiniDetail
                    label="Approval"
                    value={approvalState}
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>
            </section>
          </section>

          {/* MULTI-HAZARD PORTFOLIO */}
          <section className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Multi-Hazard Intelligence
                  </p>
                  <h3 className="mt-0.5 text-[12px] font-black text-slate-900">
                    Risk portfolio
                  </h3>
                  <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                    Ranked hazard results with clear primary-risk context.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[13px] font-black text-blue-700">
                  {availableHazards} validated
                </span>
                <span className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-[13px] font-black text-orange-700">
                  {elevatedHazards} elevated
                </span>
              </div>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {rankedRisks.map((risk, index) => {
                const scoreValue =
                  risk.riskScore === null || risk.riskScore === undefined
                    ? null
                    : safeNumber(risk.riskScore);

                const itemTone = riskTone(risk.riskLevel);

                return (
                  <div
                    key={`${risk.disasterType}-${index}`}
                    className={`rounded-2xl border p-3 transition ${
                      index === 0
                        ? "border-blue-200 bg-blue-50/45 shadow-sm"
                        : "border-slate-100 bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm ring-1 ring-slate-100">
                          {hazardIcon(risk.disasterType)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black text-slate-800">
                            {risk.disasterType || "Unknown hazard"}
                          </p>
                          <p className="mt-0.5 truncate text-[6.5px] font-semibold text-slate-400">
                            {risk.dataAvailable
                              ? risk.dataSource || "Validated source"
                              : "Data unavailable"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-[6.5px] font-black ${itemTone.badge}`}
                      >
                        {normalizeLevel(risk.riskLevel)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p
                          className={`text-[23px] font-black ${
                            scoreValue === null
                              ? "text-slate-400"
                              : itemTone.text
                          }`}
                        >
                          {scoreValue === null ? "N/A" : scoreValue.toFixed(1)}
                        </p>
                        <p className="mt-0.5 text-[6.5px] font-semibold text-slate-400">
                          Risk score / 100
                        </p>
                      </div>

                      <span
                        className={`rounded-lg px-2 py-1 text-[6.5px] font-black ${
                          index === 0
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-100"
                        }`}
                      >
                        {index === 0 ? "PRIMARY" : `#${index + 1}`}
                      </span>
                    </div>

                    {scoreValue !== null && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${itemTone.bar}`}
                          style={{ width: `${clamp(scoreValue)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {rankedRisks.length === 0 && (
                <div className="sm:col-span-2 xl:col-span-3">
                  <EmptyPanel text="No hazard portfolio data was returned." />
                </div>
              )}
            </div>
          </section>

          {/* ENVIRONMENT + FACTOR DONUT + AI INSIGHTS */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1.08fr_.92fr_1fr]">
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-emerald-600">
                  Environmental Signals
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Live prediction context
                </h3>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                  Stored environmental signals used by the prediction workflow.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                <SignalBox
                  icon={<CloudRain />}
                  label="Rainfall 24h"
                  value={`${fixed(prediction.rainfall24h)} mm`}
                  source="Live"
                />
                <SignalBox
                  icon={<CloudRain />}
                  label="Forecast rain"
                  value={`${fixed(prediction.forecastRainfall)} mm`}
                  source="Forecast"
                />
                <SignalBox
                  icon={<Thermometer />}
                  label="Temperature"
                  value={`${fixed(prediction.temperature)} C`}
                  source="Live"
                />
                <SignalBox
                  icon={<Activity />}
                  label="Humidity"
                  value={`${fixed(prediction.humidity, 0)}%`}
                  source="Live"
                />
                <SignalBox
                  icon={<Wind />}
                  label="Wind speed"
                  value={`${fixed(prediction.windSpeed)} km/h`}
                  source="Live"
                />
                <SignalBox
                  icon={<Activity />}
                  label="Soil moisture"
                  value={`${fixed(prediction.soilMoisture)}%`}
                  source="Environmental"
                />
                <SignalBox
                  icon={<Users />}
                  label="Population density"
                  value={`${formatNumber(prediction.populationDensity)} /km2`}
                  source="Exposure"
                />
                <SignalBox
                  icon={<Globe2 />}
                  label="Elevation"
                  value={`${fixed(prediction.elevation, 0)} m`}
                  source="Terrain"
                />
                <SignalBox
                  icon={<Activity />}
                  label="River flow"
                  value={`${fixed(prediction.riverFlow)} m3/s`}
                  source="Hydrology"
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-indigo-600">
                  Risk Factor Contribution
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Top contributing signals
                </h3>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                  Relative share among the returned factor contributions.
                </p>
              </div>

              <div className="p-4">
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <DonutChart
                    factors={topFactors}
                    total={factorContributionTotal}
                  />

                  <div className="w-full space-y-2">
                    {topFactors.slice(0, 6).map((factor, index) => {
                      const contribution = Math.max(
                        0,
                        safeNumber(factor.contribution)
                      );
                      const relative =
                        factorContributionTotal > 0
                          ? (contribution / factorContributionTotal) * 100
                          : 0;

                      return (
                        <div
                          key={`${factor.factor}-${index}`}
                          className="flex items-center gap-2.5"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background:
                                FACTOR_COLORS[index % FACTOR_COLORS.length],
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-black text-slate-700">
                              {factor.factor}
                            </p>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${clamp(relative)}%`,
                                  background:
                                    FACTOR_COLORS[
                                      index % FACTOR_COLORS.length
                                    ],
                                }}
                              />
                            </div>
                          </div>
                          <span className="w-10 text-right text-[13px] font-black text-slate-600">
                            {relative.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}

                    {topFactors.length === 0 && (
                      <EmptyPanel text="No structured factor contributions are available." />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-black uppercase tracking-[0.18em] text-violet-600">
                      AI Decision Insights
                    </p>
                    <h3 className="mt-1 text-[13px] font-black text-slate-900">
                      Observable assessment signals
                    </h3>
                  </div>
                  <span className="rounded-full border border-violet-100 bg-white px-2.5 py-1.5 text-[6.5px] font-black text-violet-700">
                    Decision layer
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3">
                {aiInsights.map((insight, index) => (
                  <div
                    key={`${insight.text}-${index}`}
                    className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
                      insight.ok
                        ? "border-slate-100 bg-slate-50/70"
                        : "border-amber-100 bg-amber-50/50"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        insight.ok
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {insight.ok ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Info className="h-3 w-3" />
                      )}
                    </span>
                    <p className="text-[13px] font-semibold leading-4 text-slate-600">
                      {insight.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 p-3">
                <MiniMetric
                  label="Primary dominance"
                  value={`${primaryDominance.toFixed(1)}%`}
                />
              </div>
            </section>
          </section>

          {/* SIGNAL WATCH + FACTOR DETAILS */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[.95fr_1.05fr]">
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Signal Watch
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Primary-hazard monitoring context
                </h3>
                <p className="mt-0.5 text-[13px] font-semibold leading-4 text-slate-400">
                  Monitoring cues derived from the currently selected primary hazard.
                </p>
              </div>

              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {signalWatch.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {item.icon}
                      </span>
                      <p className="text-[12px] font-black text-slate-800">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-2 text-[13px] font-black text-slate-900">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold leading-4 text-slate-400">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Risk Drivers
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Detailed factor contribution matrix
                </h3>
              </div>

              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {topFactors.map((factor, index) => {
                  const contribution = Math.max(
                    0,
                    safeNumber(factor.contribution)
                  );
                  const relative =
                    factorContributionTotal > 0
                      ? (contribution / factorContributionTotal) * 100
                      : 0;

                  return (
                    <div
                      key={`${factor.factor}-${index}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[13px] font-black text-white">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-black text-slate-800">
                              {factor.factor}
                            </p>
                            <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                              Value: {formatNumber(factor.value)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[13px] font-black ${factorTone(
                            factor.impact
                          )}`}
                        >
                          {factor.impact || "N/A"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-slate-400">
                          Contribution
                        </span>
                        <span className="font-black text-slate-700">
                          {contribution.toFixed(1)}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${clamp(relative)}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex justify-between gap-2">
                        <span className="text-[6.5px] font-semibold text-slate-400">
                          Relative share
                        </span>
                        <span className="text-[6.5px] font-black text-slate-600">
                          {relative.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}

                {topFactors.length === 0 && (
                  <div className="sm:col-span-2">
                    <EmptyPanel text="No factor records were returned by the backend." />
                  </div>
                )}
              </div>
            </section>
          </section>

          {/* DATA QUALITY + RECOMMENDATIONS */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr]">
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Data Quality
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Prediction input coverage
                </h3>
              </div>

              <div className="p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[32px] font-black text-slate-900">
                      {inputCoverage.toFixed(0)}%
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                      {populatedInputs} of {inputFields.length} tracked fields
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1.5 text-[13px] font-black ${
                      inputCoverage >= 90
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : inputCoverage >= 70
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {inputCoverage >= 90
                      ? "High coverage"
                      : inputCoverage >= 70
                        ? "Reviewable"
                        : "Needs review"}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      inputCoverage >= 90
                        ? "bg-emerald-500"
                        : inputCoverage >= 70
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${clamp(inputCoverage)}%` }}
                  />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {inputFields.map(([label, value, unit]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                    >
                      <span className="text-[13px] font-black text-slate-500">
                        {label}
                      </span>
                      <span className="text-[13px] font-black text-slate-800">
                        {fixed(value, 2)} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Operational Guidance
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Recommended actions
                </h3>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-400">
                  Actions returned by the backend for this prediction.
                </p>
              </div>

              <div className="space-y-2 p-3">
                {recommendations.slice(0, 10).map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[13px] font-black text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-slate-800">
                        Action {index + 1}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold leading-4 text-slate-500">
                        {item}
                      </p>
                    </div>
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <EmptyPanel text="No recommendations were returned." />
                )}
              </div>
            </section>
          </section>

          {/* HANDOFF + GOVERNANCE */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1fr_.8fr]">
            <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <ChevronRight className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Agent Handoff
                  </p>
                  <h3 className="mt-1 text-[13px] font-black text-slate-900">
                    Agent 01 â†’ Agent 02
                  </h3>
                  <p className="mt-0.5 text-[13px] font-semibold leading-4 text-slate-500">
                    Key prediction context prepared for the next vulnerability and impact assessment stage.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <HandoffCard label="Hazard" value={primaryType} />
                <HandoffCard label="Risk" value={`${primaryScore.toFixed(1)} / 100`} />
                <HandoffCard label="Confidence" value={`${confidence.toFixed(0)}%`} />
                <HandoffCard
                  label="Location"
                  value={prediction.location || "Unknown"}
                />
              </div>

              <div className="mt-3 rounded-xl border border-white bg-white/80 px-3 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-[12px] font-black text-slate-800">
                    {availableHazards > 0
                      ? "Validated hazard context is ready for downstream assessment."
                      : "Downstream handoff requires a validated hazard result."}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Governance
                </p>
                <h3 className="mt-1 text-[13px] font-black text-slate-900">
                  Human approval state
                </h3>
              </div>

              <div className="p-4">
                <div
                  className={`rounded-2xl border px-3 py-3 ${approvalClass(
                    approvalState
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-[13px] font-black">{approvalState}</p>
                  </div>
                  <p className="mt-1 text-[13px] font-semibold leading-4 opacity-80">
                    {prediction.requiresHumanApproval
                      ? "This prediction can remain subject to an authorized human decision before downstream operational use."
                      : "No human approval gate is attached to this prediction record."}
                  </p>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[13px] font-black uppercase tracking-wider text-slate-400">
                        Human decision controls
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold leading-4 text-slate-500">
                        Authorized reviewers can explicitly approve or reject this prediction record.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:w-[230px]">
                      <button
                        type="button"
                        disabled={approvalLoading || prediction.isApproved}
                        onClick={() => handleApproval("approve")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[12px] font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {approvalLoading ? "Processing..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={approvalLoading}
                        onClick={() => handleApproval("reject")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-[12px] font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        {approvalLoading ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>

                {approvalError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {approvalError}
                  </div>
                )}
              </div>
            </section>
          </section>

          <p className="py-3 text-center text-[6.5px] font-semibold text-slate-400">
            ReliefNexus Â· Risk Prediction Agent Â· Detailed operational intelligence generated from the selected prediction record.
          </p>
        </main>
      </div>
    </div>
  );
}

function approvalClass(state: string): string {
  const value = state.toLowerCase();

  if (value.includes("approved")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("pending")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (value.includes("rejected")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function HeroKpi({
  label,
  value,
  detail,
  tone,
  ring = false,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
  ring?: boolean;
}) {
  const itemTone = riskTone(tone);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-md">
      <div className="relative flex items-center gap-2.5">
        {ring ? (
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15">
            <div
              className="absolute inset-1 rounded-full"
              style={{
                background: `conic-gradient(${tone === "Critical" ? "#ef4444" : tone === "High" ? "#f97316" : tone === "Moderate" ? "#f59e0b" : "#10b981"} ${clamp(
                  safeNumber(value)
                )}%, rgba(255,255,255,.12) 0)`,
              }}
            />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/85">
              <span className="text-[12px] font-black text-white">{value}</span>
            </div>
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="truncate text-[12px] font-black uppercase tracking-[0.15em] text-white/45">
            {label}
          </p>
          <p
            className={`mt-1 truncate text-[13px] font-black ${
              tone ? itemTone.badge.split(" ").filter((x) => x.startsWith("text-"))[0] || "text-white" : "text-white"
            }`}
          >
            {value}
          </p>
          <p className="mt-0.5 truncate text-[12px] font-semibold text-white/45">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/85 px-3 py-2.5 shadow-sm">
      <p className="text-[12px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MiniDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <p className="text-[6.5px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-1 truncate text-[12px] font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SignalBox({
  icon,
  label,
  value,
  source,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  source: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-center gap-1.5 text-blue-600">
        <span>{icon}</span>
        <span className="text-[12px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-2 text-[13px] font-black text-slate-800">{value}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-slate-400">{source}</p>
    </div>
  );
}

function HandoffCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white bg-white/85 p-3 shadow-sm">
      <p className="text-[12px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-black text-slate-800">{value}</p>
    </div>
  );
}

function DonutChart({
  factors,
  total,
}: {
  factors: RiskFactor[];
  total: number;
}) {
  const segments = factors
    .map((factor) => Math.max(0, safeNumber(factor.contribution)))
    .filter((value) => value > 0);

  let cursor = 0;
  const gradientSegments: string[] = [];

  segments.slice(0, FACTOR_COLORS.length).forEach((value, index) => {
    const start = cursor;
    const end = total > 0 ? cursor + (value / total) * 100 : cursor;
    gradientSegments.push(
      `${FACTOR_COLORS[index]} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    );
    cursor = end;
  });

  if (cursor < 100) {
    gradientSegments.push(`#e2e8f0 ${cursor.toFixed(2)}% 100%`);
  }

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${
            gradientSegments.length
              ? gradientSegments.join(",")
              : "#e2e8f0 0% 100%"
          })`,
        }}
      />
      <div className="absolute inset-[20px] flex flex-col items-center justify-center rounded-full bg-white shadow-sm">
        <p className="text-[17px] font-black text-slate-900">
          {factors.length ? `${((segments.slice(0, 3).reduce((a, b) => a + b, 0) / Math.max(total, 1)) * 100).toFixed(1)}%` : "N/A"}
        </p>
        <p className="text-[12px] font-black uppercase tracking-wider text-slate-400">
          Top 3 share
        </p>
      </div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <Info className="mx-auto h-4 w-4 text-slate-400" />
      <p className="mt-2 text-[12px] font-bold text-slate-500">{text}</p>
    </div>
  );
}





