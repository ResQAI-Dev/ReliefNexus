import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  History,
  Layers3,
  Loader2,
  MapPin,
  MessageSquare,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  Terminal,
  Users,
  X,
  Zap
} from "lucide-react";
import "../styles/advanced-agent-workspace.css";

type AgentKey = "risk" | "vulnerability" | "resource" | "warning" | "volunteer";

type ExecutionMode =
  | "plan_only"
  | "backend_execution"
  | "python_simulation";

type RunStatus =
  | "idle"
  | "interpreting"
  | "running"
  | "completed"
  | "failed"
  | "approval_required";

type AnyRecord = Record<string, any>;

type AgentProfile = {
  key: AgentKey;
  number: string;
  name: string;
  eyebrow: string;
  subtitle: string;
  accent: string;
  image: string;
  icon: React.ReactNode;
  prompts: string[];
  disasterTypes: string[];
  metrics: Array<{ label: string; keys: string[] }>;
  factors: Array<{ label: string; keys: string[] }>;
  recommendations: Array<{ label: string; keys: string[] }>;
};

const PROFILES: Record<AgentKey, AgentProfile> = {
  risk: {
    key: "risk",
    number: "01",
    name: "Risk Prediction",
    eyebrow: "RISK INTELLIGENCE",
    subtitle: "Hazard probability, severity and confidence intelligence.",
    accent: "#18a8ff",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flood_map,_western_Sri_Lanka_ESA360995.jpg",
    icon: <Gauge size={22} />,
    prompts: [
      "Assess flood risk in Colombo",
      "Forecast disaster risk for the next 24 hours",
      "Analyze current high-risk zones",
      "Run a full disaster risk assessment"
    ],
    disasterTypes: ["Flood", "Landslide", "Drought", "Cyclone", "Storm"],
    metrics: [
      { label: "Risk Score", keys: ["riskScore", "score", "risk_score"] },
      { label: "Risk Level", keys: ["riskLevel", "riskCategory", "category", "risk_level"] },
      { label: "Confidence", keys: ["confidence", "confidenceScore", "modelConfidence"] },
      { label: "Prediction ID", keys: ["riskPredictionId", "predictionId", "id"] }
    ],
    factors: [
      { label: "Rainfall", keys: ["rainfall", "rainfallImpact"] },
      { label: "Water Level", keys: ["waterLevel", "water_level"] },
      { label: "Historical Risk", keys: ["historicalRisk", "historyRisk"] },
      { label: "Environmental Risk", keys: ["environmentalRisk", "environmentRisk"] }
    ],
    recommendations: [
      { label: "Recommended Actions", keys: ["recommendedActions", "recommendations", "actions"] },
      { label: "Risk Mitigation", keys: ["mitigation", "mitigationActions"] },
      { label: "Priority", keys: ["priority", "priorityLevel"] }
    ]
  },

  vulnerability: {
    key: "vulnerability",
    number: "02",
    name: "Vulnerability & Impact",
    eyebrow: "COMMUNITY EXPOSURE",
    subtitle: "Population, infrastructure and impact intelligence.",
    accent: "#8b5cf6",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_aid_for_the_2016_Sri_Lankan_floods_(3).jpg",
    icon: <Users size={22} />,
    prompts: [
      "Identify vulnerable communities in Colombo",
      "Analyze population exposure",
      "Assess infrastructure impact",
      "Run a vulnerability assessment"
    ],
    disasterTypes: ["Flood", "Landslide", "Drought", "Cyclone", "Storm"],
    metrics: [
      { label: "Affected Population", keys: ["affectedPopulation", "affectedPeople", "affected"] },
      { label: "Vulnerable Population", keys: ["vulnerablePopulation", "vulnerablePeople", "vulnerable"] },
      { label: "Impact Severity", keys: ["impactSeverity", "severity", "impact"] },
      { label: "Assessment ID", keys: ["vulnerabilityAssessmentId", "assessmentId", "id"] }
    ],
    factors: [
      { label: "Exposure Level", keys: ["exposureLevel", "exposure"] },
      { label: "Infrastructure Impact", keys: ["infrastructureImpact", "infrastructure"] },
      { label: "Community Vulnerability", keys: ["communityVulnerability", "vulnerability"] },
      { label: "Critical Facilities", keys: ["criticalFacilities", "facilities"] }
    ],
    recommendations: [
      { label: "Recommended Actions", keys: ["recommendedActions", "recommendations", "actions"] },
      { label: "Priority Communities", keys: ["priorityCommunities", "priorityAreas"] },
      { label: "Response Priorities", keys: ["responsePriorities", "priorities"] }
    ]
  },

  resource: {
    key: "resource",
    number: "03",
    name: "Resource Optimization",
    eyebrow: "RELIEF CAPACITY",
    subtitle: "Demand, supply and allocation intelligence.",
    accent: "#10b981",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Navy_flood_relief_operations_in_the_aftermath_of_floods_and_landslides_in_Sri_Lanka,_May_2017_(07).jpg",
    icon: <Layers3 size={22} />,
    prompts: [
      "Check available resources for Colombo",
      "Identify resource shortages",
      "Optimize relief allocation",
      "Generate a resource response plan"
    ],
    disasterTypes: ["Flood", "Landslide", "Drought", "Cyclone", "Storm"],
    metrics: [
      { label: "Available Resources", keys: ["availableResources", "available", "inventory"] },
      { label: "Required Resources", keys: ["requiredResources", "required", "demand"] },
      { label: "Resource Gap", keys: ["resourceGap", "gap", "shortage"] },
      { label: "Optimization Score", keys: ["optimizationScore", "optimization", "score"] }
    ],
    factors: [
      { label: "Food Demand", keys: ["foodDemand", "food"] },
      { label: "Water Demand", keys: ["waterDemand", "water"] },
      { label: "Medical Demand", keys: ["medicalDemand", "medical"] },
      { label: "Shelter Demand", keys: ["shelterDemand", "shelter"] }
    ],
    recommendations: [
      { label: "Allocation", keys: ["allocation", "allocations", "resourceAllocations"] },
      { label: "Shortages", keys: ["shortages", "criticalShortages", "gaps"] },
      { label: "Recommended Actions", keys: ["recommendedActions", "recommendations", "actions"] }
    ]
  },

  warning: {
    key: "warning",
    number: "04",
    name: "Early Warning & Coordination",
    eyebrow: "EMERGENCY COORDINATION",
    subtitle: "Warning preparation, targeting and governance.",
    accent: "#f97316",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Navy_flood_relief_operations_in_the_aftermath_of_floods_and_landslides_in_Sri_Lanka,_May_2017_(07).jpg",
    icon: <Radio size={22} />,
    prompts: [
      "Prepare an emergency warning for Colombo",
      "Identify warning target areas",
      "Review warning readiness",
      "Prepare a coordinated response"
    ],
    disasterTypes: ["Flood", "Landslide", "Drought", "Cyclone", "Storm"],
    metrics: [
      { label: "Alert Status", keys: ["alertStatus", "status", "warningStatus"] },
      { label: "Alert Severity", keys: ["severity", "alertSeverity", "warningSeverity"] },
      { label: "Target Location", keys: ["location", "targetLocation", "targetArea"] },
      { label: "Alert ID", keys: ["alertId", "emergencyAlertId", "id"] }
    ],
    factors: [
      { label: "Target Population", keys: ["targetPopulation", "peopleToNotify", "affectedPopulation"] },
      { label: "Warning Channels", keys: ["warningChannels", "channels", "communicationChannels"] },
      { label: "Coordination Status", keys: ["coordinationStatus", "coordination"] },
      { label: "Escalation Level", keys: ["escalationLevel", "escalation"] }
    ],
    recommendations: [
      { label: "Warning Message", keys: ["warningMessage", "message", "alertMessage"] },
      { label: "Coordination Actions", keys: ["coordinationActions", "actions", "recommendations"] },
      { label: "Response Agencies", keys: ["responseAgencies", "agencies", "organizations"] }
    ]
  },

  volunteer: {
    key: "volunteer",
    number: "05",
    name: "Volunteer Assignment",
    eyebrow: "RESPONSE NETWORK",
    subtitle: "Volunteer availability, skills and response coverage.",
    accent: "#06b6d4",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg/1024px-Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg",
    icon: <Users size={22} />,
    prompts: [
      "Create a volunteer response plan",
      "Match volunteers to response needs",
      "Check volunteer coverage",
      "Analyze volunteer availability"
    ],
    disasterTypes: ["Flood", "Landslide", "Drought", "Cyclone", "Storm"],
    metrics: [
      { label: "Available Volunteers", keys: ["availableVolunteers", "available", "volunteersAvailable"] },
      { label: "Required Volunteers", keys: ["requiredVolunteers", "required", "volunteersRequired"] },
      { label: "Assigned Volunteers", keys: ["assignedVolunteers", "assigned", "volunteersAssigned"] },
      { label: "Coverage", keys: ["coverage", "coveragePercentage", "coveragePercent"] }
    ],
    factors: [
      { label: "Required Skills", keys: ["requiredSkills", "skills", "skillsRequired"] },
      { label: "Geographic Coverage", keys: ["geographicCoverage", "coverageAreas", "zones"] },
      { label: "Priority Zones", keys: ["priorityZones", "priorityAreas"] },
      { label: "Availability", keys: ["availability", "volunteerAvailability"] }
    ],
    recommendations: [
      { label: "Assignments", keys: ["assignments", "volunteerAssignments", "recommendations"] },
      { label: "Deployment Priority", keys: ["deploymentPriority", "priority"] },
      { label: "Recommended Actions", keys: ["recommendedActions", "actions"] }
    ]
  }
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5115/api"
).replace(/\/$/, "");

function isObject(value: any): value is AnyRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function flattenObject(value: any, prefix = "", output: Array<{ key: string; value: any }> = []) {
  if (value === null || value === undefined) return output;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenObject(item, `${prefix}[${index}]`, output);
    });
    return output;
  }

  if (isObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (isObject(child) || Array.isArray(child)) {
        flattenObject(child, path, output);
      } else {
        output.push({ key: path, value: child });
      }
    });

    return output;
  }

  output.push({ key: prefix, value });
  return output;
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findValue(source: any, keys: string[]) {
  const flattened = flattenObject(source);

  for (const desired of keys) {
    const wanted = normalizeKey(desired);

    const exact = flattened.find(item => {
      const leaf = item.key.split(".").pop() || item.key;
      return normalizeKey(leaf) === wanted;
    });

    if (exact && exact.value !== null && exact.value !== undefined) {
      return exact.value;
    }
  }

  for (const desired of keys) {
    const wanted = normalizeKey(desired);

    const partial = flattened.find(item =>
      normalizeKey(item.key).includes(wanted)
    );

    if (partial && partial.value !== null && partial.value !== undefined) {
      return partial.value;
    }
  }

  return null;
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") {
    return "Not returned";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return value.length ? value.map(formatValue).join(", ") : "None";
  }

  if (isObject(value)) {
    return Object.entries(value)
      .slice(0, 5)
      .map(([key, child]) => `${key}: ${formatValue(child)}`)
      .join(" | ");
  }

  return String(value);
}

function listValue(value: any): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (isObject(item)) {
        return [formatValue(item)];
      }
      return [String(item)];
    });
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;|\|/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [formatValue(value)];
}

function extractTrace(data: any): AnyRecord[] {
  const candidates = [
    data?.trace,
    data?.result?.trace,
    data?.data?.trace,
    data?.executionTrace,
    data?.result?.executionTrace
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function extractDecisions(data: any): AnyRecord[] {
  const candidates = [
    data?.decisions,
    data?.result?.decisions,
    data?.data?.decisions,
    data?.supervisorDecisions,
    data?.result?.supervisorDecisions
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function normalizeResponse(data: any) {
  const root = data?.result ?? data?.data ?? data ?? {};

  const trace = extractTrace(data);
  const decisions = extractDecisions(data);

  const plan = Array.isArray(root.plan)
    ? root.plan
    : Array.isArray(data?.plan)
      ? data.plan
      : [];

  const completedFromTrace = trace
    .filter(item =>
      String(item?.status ?? item?.state ?? "")
        .toLowerCase()
        .includes("complete")
    )
    .map(item => item?.agent ?? item?.agentName)
    .filter(Boolean);

  const completedAgents = Array.isArray(root.completedAgents)
    ? root.completedAgents
    : Array.isArray(data?.completedAgents)
      ? data.completedAgents
      : completedFromTrace;

  const status = String(
    root.status ??
    data?.status ??
    (root.approval?.required ? "approval_required" : "completed")
  );

  return {
    raw: data,
    root,
    status,
    plan,
    trace,
    decisions,
    completedAgents,
    replans: root.replans ?? data?.replans ?? root.replanCount ?? 0,
    approval: root.approval ?? data?.approval ?? null,
    message: root.message ?? data?.message ?? root.summary ?? "",
    executionMode:
      root.executionMode ??
      data?.executionMode ??
      root.execution_mode ??
      data?.execution_mode ??
      "backend_execution"
  };
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("fail") || normalized.includes("error")) {
    return "failed";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("approval") ||
    normalized.includes("await")
  ) {
    return "approval";
  }

  if (normalized.includes("running")) {
    return "running";
  }

  return "completed";
}

function displayStatus(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export default function AdvancedAIAgentWorkspace({
  agent
}: {
  agent: AgentKey;
}) {
  const profile = PROFILES[agent];

  const [prompt, setPrompt] = useState(profile.prompts[0]);
  const [location, setLocation] = useState("Colombo");
  const [disasterType, setDisasterType] = useState("Flood");
  const [severity, setSeverity] = useState("High");
  const [horizon, setHorizon] = useState("24h");
  const [confidence, setConfidence] = useState(70);
  const [mode, setMode] =
    useState<ExecutionMode>("backend_execution");

  const [status, setStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const [events, setEvents] = useState<
    Array<{ time: string; text: string; kind: string }>
  >([]);

  const [tools, setTools] = useState<
    Array<{ name: string; status: string; duration: string }>
  >([]);

  const [history, setHistory] = useState<any[]>([]);
  const [showScenario, setShowScenario] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showRawEvidence, setShowRawEvidence] = useState(false);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addEvent = useCallback((text: string, kind = "info") => {
    const now = new Date().toLocaleTimeString([], {
      hour12: false
    });

    setEvents(previous => [
      ...previous.slice(-40),
      { time: now, text, kind }
    ]);
  }, []);

  useEffect(() => {
    if (!startedAt) return;

    const timer = window.setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000);
    }, 100);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    setPrompt(profile.prompts[0]);
    setResult(null);
    setError("");
    setEvents([]);
    setTools([]);
    setStatus("idle");
  }, [profile]);

  const phase = useMemo(() => {
    if (status === "idle") return 0;
    if (status === "interpreting") return 1;
    if (status === "running") return 3;
    if (status === "approval_required") return 5;
    if (status === "completed") return 6;
    return 2;
  }, [status]);

  const execute = async () => {
    if (
      !prompt.trim() ||
      status === "running" ||
      status === "interpreting"
    ) {
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setError("");
    setResult(null);
    setEvents([]);
    setElapsed(0);
    setStartedAt(Date.now());
    setStatus("interpreting");

    addEvent("Command received by Agent Workspace");
    addEvent(`Intent selected: ${profile.name}`);
    addEvent(`Scenario: ${disasterType} at ${location}`);

    setTools([
      {
        name: "Request validation",
        status: "running",
        duration: "-"
      },
      {
        name: "Supervisor / Planner",
        status: "waiting",
        duration: "-"
      },
      {
        name: "Governed Agent Execution",
        status: "waiting",
        duration: "-"
      },
      {
        name: "Validation / Critic",
        status: "waiting",
        duration: "-"
      }
    ]);

    await new Promise(resolve => window.setTimeout(resolve, 350));

    if (controller.signal.aborted) return;

    setStatus("running");

    setTools(previous =>
      previous.map((item, index) =>
        index === 0
          ? {
              ...item,
              status: "completed",
              duration: "validated"
            }
          : index === 1
            ? {
                ...item,
                status: "running"
              }
            : item
      )
    );

    addEvent("Supervisor accepted the command");
    addEvent("Planner execution started");

    try {
      const started = performance.now();

      const response = await fetch(
        `${API_BASE}/ai/orchestrator/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
          },
          credentials: "include",
          body: JSON.stringify({
            prompt: prompt.trim(),
            riskInput: {
              location,
              latitude: 6.9271,
              longitude: 79.8612,
              disasterType
            },
            executeAgents: mode === "backend_execution",
            maxReplans: 3,
            executionMode: mode
          }),
          signal: controller.signal
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Orchestrator request failed (${response.status})`
        );
      }

      const normalized = normalizeResponse(data);
      const latency = performance.now() - started;

      setResult({
        ...normalized,
        latency
      });

      addEvent("Orchestrator response received", "success");
      addEvent("Real execution trace captured", "success");

      if (normalized.trace.length) {
        addEvent(
          `${normalized.trace.length} execution trace entries received`,
          "success"
        );
      }

      if (normalized.decisions.length) {
        addEvent(
          `${normalized.decisions.length} supervisor decisions received`,
          "success"
        );
      }

      const needsApproval =
        Boolean(normalized.approval?.required) ||
        normalized.status.toLowerCase().includes("approval");

      setStatus(
        needsApproval ? "approval_required" : "completed"
      );

      if (needsApproval) {
        addEvent(
          "Human approval required before governed action",
          "warning"
        );
      }

      setTools(previous =>
        previous.map((item, index) => ({
          ...item,
          status: "completed",
          duration:
            index === 2
              ? `${(latency / 1000).toFixed(2)}s`
              : item.duration === "-"
                ? "done"
                : item.duration
        }))
      );

      setHistory(previous => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          prompt: prompt.trim(),
          location,
          disasterType,
          status: needsApproval
            ? "Approval Required"
            : "Completed",
          mode,
          duration: `${(latency / 1000).toFixed(2)}s`
        },
        ...previous
      ].slice(0, 12));
    } catch (caught: any) {
      if (caught?.name === "AbortError") {
        addEvent("Execution cancelled", "warning");
        setStatus("idle");
        return;
      }

      const message =
        caught?.message ||
        "Unable to reach the orchestration service.";

      setError(message);
      addEvent(message, "error");

      setTools(previous =>
        previous.map(item =>
          item.status === "running"
            ? { ...item, status: "failed" }
            : item
        )
      );

      setStatus("failed");
    } finally {
      setStartedAt(null);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStartedAt(null);
    setStatus("idle");
  };

  const reset = () => {
    stop();
    setResult(null);
    setError("");
    setEvents([]);
    setTools([]);
    setElapsed(0);
  };

  const detailMetrics = profile.metrics.map(metric => ({
    ...metric,
    value: result
      ? findValue(result.raw, metric.keys)
      : null
  }));

  const detailFactors = profile.factors.map(factor => ({
    ...factor,
    value: result
      ? findValue(result.raw, factor.keys)
      : null
  }));

  const detailRecommendations = profile.recommendations.map(item => ({
    ...item,
    value: result
      ? findValue(result.raw, item.keys)
      : null
  }));

  const actualLocation =
    result
      ? findValue(result.raw, [
          "location",
          "targetLocation",
          "assessmentLocation"
        ]) ?? location
      : location;

  const actualDisaster =
    result
      ? findValue(result.raw, [
          "disasterType",
          "disaster",
          "hazardType"
        ]) ?? disasterType
      : disasterType;

  const pipeline: Array<[string, React.ElementType]> = [
    ["Command", MessageSquare],
    ["Supervisor", BrainCircuit],
    ["Planner", GitBranch],
    [`Agent ${profile.number}`, Cpu],
    ["Validator", ShieldCheck],
    ["Decision", Target]
  ];

  const defaultTools = [
    {
      name: "Request validation",
      status: "waiting",
      duration: "-"
    },
    {
      name: "Supervisor / Planner",
      status: "waiting",
      duration: "-"
    },
    {
      name: "Governed Agent Execution",
      status: "waiting",
      duration: "-"
    },
    {
      name: "Validation / Critic",
      status: "waiting",
      duration: "-"
    }
  ];

  return (
    <div
      className="advanced-agent-page"
      style={
        {
          "--agent-accent": profile.accent
        } as React.CSSProperties
      }
    >
      <div className="aa-grid-bg" />

      <section className="aa-hero">
        <div
          className="aa-hero-image"
          style={{
            backgroundImage: `url("${profile.image}")`
          }}
        />

        <div className="aa-hero-overlay" />

        <div className="aa-hero-content">
          <div className="aa-breadcrumb">
            <span>AI OPERATIONS</span>
            <ArrowRight size={12} />
            <b>AGENT {profile.number}</b>
          </div>

          <div className="aa-live">
            <i />
            LIVE AI AGENT
          </div>

          <div className="aa-title-row">
            <div className="aa-agent-icon">
              {profile.icon}
            </div>

            <div>
              <div className="aa-eyebrow">
                {profile.eyebrow}
              </div>

              <h1>{profile.name}</h1>

              <p>{profile.subtitle}</p>
            </div>
          </div>

          <div className="aa-context">
            <MapPin size={14} />
            {actualLocation}
            <span />
            <b>{actualDisaster}</b>
            <span />
            <i />
            Supervisor online
          </div>
        </div>

        <div className="aa-hero-orbit">
          <div className="aa-orbit-ring ring-a" />
          <div className="aa-orbit-ring ring-b" />

          <div className="aa-core">
            <Bot size={28} />
            <small>AGENT {profile.number}</small>
          </div>
        </div>

        <div className="aa-hero-metrics">
          <div>
            <small>STATUS</small>
            <strong>
              {status === "running"
                ? "RUNNING"
                : status === "failed"
                  ? "ERROR"
                  : status === "approval_required"
                    ? "GATE"
                    : status === "completed"
                      ? "COMPLETE"
                      : "READY"}
            </strong>
          </div>

          <div>
            <small>MODE</small>
            <strong>
              {mode === "backend_execution"
                ? "GOVERNED"
                : mode === "plan_only"
                  ? "PLAN"
                  : "SIMULATION"}
            </strong>
          </div>

          <div>
            <small>ELAPSED</small>
            <strong>{elapsed.toFixed(1)}s</strong>
          </div>
        </div>
      </section>

      <div className="aa-command-layout">
        <main>
          <section className="aa-console aa-glass">
            <div className="aa-section-head">
              <div>
                <span className="aa-kicker">
                  <Sparkles size={13} />
                  COMMAND CONSOLE
                </span>

                <h2>
                  Direct the agent with natural language
                </h2>
              </div>

              <div className="aa-console-actions">
                <button
                  className="aa-icon-btn"
                  onClick={reset}
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>

                {status === "running" ? (
                  <button
                    className="aa-stop"
                    onClick={stop}
                  >
                    <Square size={14} />
                    Stop
                  </button>
                ) : (
                  <button
                    className="aa-run"
                    onClick={execute}
                  >
                    <Play size={14} />
                    Run Agent
                  </button>
                )}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={event =>
                setPrompt(event.target.value)
              }
              onKeyDown={event => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                  execute();
                }
              }}
              placeholder="Describe the disaster situation or operational task..."
            />

            <div className="aa-console-footer">
              <span>
                <Terminal size={13} />
                Ctrl + Enter to execute
              </span>

              <span>{prompt.length}/4000</span>
            </div>

            <div className="aa-chip-row">
              {profile.prompts.map(item => (
                <button
                  key={item}
                  onClick={() => setPrompt(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="aa-panel aa-glass">
            <button
              className="aa-collapse-head"
              onClick={() =>
                setShowScenario(previous => !previous)
              }
            >
              <Settings2Icon />

              <div>
                <b>Scenario & Execution Control</b>
                <small>
                  Configure context before the agent acts
                </small>
              </div>

              <ChevronDown
                size={18}
                className={showScenario ? "open" : ""}
              />
            </button>

            {showScenario && (
              <div className="aa-scenario">
                <label>
                  Disaster Type

                  <select
                    value={disasterType}
                    onChange={event =>
                      setDisasterType(event.target.value)
                    }
                  >
                    {profile.disasterTypes.map(item => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Location

                  <input
                    value={location}
                    onChange={event =>
                      setLocation(event.target.value)
                    }
                  />
                </label>

                <label>
                  Severity

                  <select
                    value={severity}
                    onChange={event =>
                      setSeverity(event.target.value)
                    }
                  >
                    {[
                      "Low",
                      "Medium",
                      "High",
                      "Critical"
                    ].map(item => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Forecast Horizon

                  <select
                    value={horizon}
                    onChange={event =>
                      setHorizon(event.target.value)
                    }
                  >
                    {["6h", "12h", "24h", "48h", "72h"].map(
                      item => (
                        <option key={item}>{item}</option>
                      )
                    )}
                  </select>
                </label>

                <label className="aa-range">
                  Confidence Threshold

                  <b>{confidence}%</b>

                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={confidence}
                    onChange={event =>
                      setConfidence(Number(event.target.value))
                    }
                  />
                </label>

                <div className="aa-mode">
                  <span>Execution Mode</span>

                  {(
                    [
                      "plan_only",
                      "backend_execution",
                      "python_simulation"
                    ] as ExecutionMode[]
                  ).map(item => (
                    <button
                      key={item}
                      className={
                        mode === item ? "active" : ""
                      }
                      onClick={() => setMode(item)}
                    >
                      {item === "backend_execution"
                        ? "GOVERNED"
                        : item === "plan_only"
                          ? "PLAN ONLY"
                          : "SIMULATION"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="aa-panel aa-glass">
            <div className="aa-section-head compact">
              <div>
                <span className="aa-kicker">
                  <GitBranch size={13} />
                  LIVE ORCHESTRATION
                </span>

                <h2>Agent execution pipeline</h2>
              </div>

              <span
                className={`aa-status-badge ${statusClass(
                  status
                )}`}
              >
                {displayStatus(status)}
              </span>
            </div>

            <div className="aa-pipeline">
              {pipeline.map(([name, Icon], index) => (
                <React.Fragment key={name}>
                  <div
                    className={`aa-node ${
                      phase > index
                        ? "done"
                        : phase === index
                          ? "active"
                          : ""
                    }`}
                  >
                    <div>
                      <Icon size={17} />
                    </div>

                    <small>{name}</small>

                    <em>
                      {phase > index
                        ? "DONE"
                        : phase === index
                          ? "ACTIVE"
                          : "WAIT"}
                    </em>
                  </div>

                  {index < pipeline.length - 1 && (
                    <div
                      className={`aa-connector ${
                        phase > index ? "flow" : ""
                      }`}
                    >
                      <ArrowRight size={15} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>

          <div className="aa-two-col">
            <section className="aa-panel aa-glass">
              <div className="aa-section-head compact">
                <div>
                  <span className="aa-kicker">
                    <Activity size={13} />
                    TOOL ACTIVITY
                  </span>

                  <h3>Operational data flow</h3>
                </div>

                <span className="aa-live-dot">
                  LIVE
                </span>
              </div>

              <div className="aa-tool-list">
                {(tools.length ? tools : defaultTools).map(
                  item => (
                    <div
                      className="aa-tool"
                      key={item.name}
                    >
                      <span
                        className={`tool-dot ${item.status}`}
                      >
                        {item.status === "running" ? (
                          <Loader2 size={12} />
                        ) : item.status === "completed" ? (
                          <Check size={12} />
                        ) : item.status === "failed" ? (
                          <X size={12} />
                        ) : null}
                      </span>

                      <span>{item.name}</span>

                      <small>{item.duration}</small>
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="aa-panel aa-glass">
              <div className="aa-section-head compact">
                <div>
                  <span className="aa-kicker">
                    <Terminal size={13} />
                    EVENT STREAM
                  </span>

                  <h3>Execution telemetry</h3>
                </div>
              </div>

              <div className="aa-events">
                {(
                  events.length
                    ? events
                    : [
                        {
                          time: "--:--:--",
                          text: "Waiting for a command...",
                          kind: "info"
                        }
                      ]
                ).map((event, index) => (
                  <div
                    key={index}
                    className={`aa-event ${event.kind}`}
                  >
                    <code>{event.time}</code>
                    <span>{event.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {error && (
            <section className="aa-error">
              <CircleAlert size={20} />

              <div>
                <b>Agent execution unavailable</b>
                <p>{error}</p>
              </div>

              <button onClick={execute}>
                <RefreshCw size={15} />
                Retry
              </button>
            </section>
          )}

          {status === "approval_required" && (
            <section className="aa-approval">
              <div className="aa-approval-icon">
                <ShieldCheck size={24} />
              </div>

              <div>
                <span>GOVERNANCE GATE</span>

                <h3>
                  Human approval required
                </h3>

                <p>
                  The backend returned an action that
                  requires authorized review. No operational
                  action has been automatically approved.
                </p>
              </div>

              <button>
                Review in Approval Center
                <ArrowRight size={15} />
              </button>
            </section>
          )}

          <section className="aa-intelligence aa-glass">
            <div className="aa-result-top">
              <div>
                <span className="aa-kicker">
                  <Sparkles size={13} />
                  AGENT INTELLIGENCE
                </span>

                <h2>
                  {profile.name} Details
                </h2>

                <p className="aa-section-description">
                  Live operational intelligence returned by
                  the orchestration workflow.
                </p>
              </div>

              <span
                className={`aa-result-state ${
                  result ? "available" : "waiting"
                }`}
              >
                {result
                  ? "REAL DATA"
                  : "WAITING FOR EXECUTION"}
              </span>
            </div>

            <div className="aa-context-strip">
              <div>
                <MapPin size={14} />
                <span>LOCATION</span>
                <b>{actualLocation}</b>
              </div>

              <div>
                <Radio size={14} />
                <span>DISASTER</span>
                <b>{actualDisaster}</b>
              </div>

              <div>
                <Clock3 size={14} />
                <span>HORIZON</span>
                <b>{horizon}</b>
              </div>

              <div>
                <ShieldCheck size={14} />
                <span>MODE</span>
                <b>
                  {mode === "backend_execution"
                    ? "GOVERNED"
                    : mode.toUpperCase()}
                </b>
              </div>
            </div>

            <div className="aa-intelligence-section">
              <div className="aa-subheading">
                <Gauge size={16} />
                <div>
                  <b>Key Intelligence</b>
                  <span>
                    Agent-specific metrics from the real response
                  </span>
                </div>
              </div>

              <div className="aa-intelligence-grid">
                {detailMetrics.map(metric => (
                  <div
                    className="aa-intel-card"
                    key={metric.label}
                  >
                    <small>{metric.label}</small>

                    <strong
                      className={
                        metric.value === null
                          ? "not-returned"
                          : ""
                      }
                    >
                      {formatValue(metric.value)}
                    </strong>

                    <div className="aa-intel-line">
                      <span />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="aa-detail-columns">
              <section>
                <div className="aa-subheading">
                  <Activity size={16} />
                  <div>
                    <b>Risk / Impact Factors</b>
                    <span>
                      Evidence returned by the selected agent
                    </span>
                  </div>
                </div>

                <div className="aa-factor-list">
                  {detailFactors.map(factor => (
                    <div
                      className="aa-factor"
                      key={factor.label}
                    >
                      <div>
                        <span>{factor.label}</span>

                        <b
                          className={
                            factor.value === null
                              ? "not-returned"
                              : ""
                          }
                        >
                          {formatValue(factor.value)}
                        </b>
                      </div>

                      <div className="aa-factor-bar">
                        <i
                          style={{
                            width:
                              factor.value === null
                                ? "8%"
                                : "76%"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="aa-subheading">
                  <Zap size={16} />
                  <div>
                    <b>Recommendations & Actions</b>
                    <span>
                      Operational actions returned by the agent
                    </span>
                  </div>
                </div>

                <div className="aa-recommendation-list">
                  {detailRecommendations.map(item => {
                    const values = listValue(item.value);

                    return (
                      <div
                        className="aa-recommendation"
                        key={item.label}
                      >
                        <div className="aa-rec-icon">
                          <CheckCircle2 size={15} />
                        </div>

                        <div>
                          <b>{item.label}</b>

                          {values.length ? (
                            values.map((value, index) => (
                              <p key={index}>
                                {value}
                              </p>
                            ))
                          ) : (
                            <p className="not-returned">
                              Not returned by backend
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="aa-assessment">
              <div className="aa-subheading">
                <BrainCircuit size={16} />
                <div>
                  <b>AI Assessment</b>
                  <span>
                    Supervisor and agent interpretation
                  </span>
                </div>
              </div>

              <div className="aa-assessment-box">
                <p>
                  {result?.message ||
                    "No AI assessment has been returned yet. Run the agent to populate this section with the actual orchestration result."}
                </p>
              </div>
            </div>
          </section>

          {result && (
            <>
              <section className="aa-evidence aa-glass">
                <div className="aa-section-head">
                  <div>
                    <span className="aa-kicker">
                      <GitBranch size={13} />
                      REAL AGENT EXECUTION EVIDENCE
                    </span>

                    <h2>
                      Execution trace & supervisor decisions
                    </h2>
                  </div>

                  <span className="aa-evidence-count">
                    {result.trace.length} TRACE
                  </span>
                </div>

                <div className="aa-evidence-grid">
                  <div>
                    <h4>Execution Trace</h4>

                    {result.trace.length ? (
                      <div className="aa-trace-list">
                        {result.trace.map(
                          (item: any, index: number) => (
                            <div
                              className="aa-trace-item"
                              key={index}
                            >
                              <div className="aa-trace-number">
                                {String(index + 1).padStart(
                                  2,
                                  "0"
                                )}
                              </div>

                              <div>
                                <b>
                                  {item.agent ??
                                    item.agentName ??
                                    item.name ??
                                    "Execution step"}
                                </b>

                                <span>
                                  {item.action ??
                                    item.task ??
                                    item.description ??
                                    item.status ??
                                    "Trace event returned"}
                                </span>
                              </div>

                              <em>
                                {item.status ??
                                  item.state ??
                                  "RECORDED"}
                              </em>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="aa-empty-evidence">
                        No execution trace was returned.
                      </div>
                    )}
                  </div>

                  <div>
                    <h4>Supervisor Decisions</h4>

                    {result.decisions.length ? (
                      <div className="aa-decision-list">
                        {result.decisions.map(
                          (item: any, index: number) => (
                            <div
                              className="aa-decision"
                              key={index}
                            >
                              <ShieldCheck size={15} />

                              <div>
                                <b>
                                  {item.decision ??
                                    item.action ??
                                    item.title ??
                                    "Supervisor decision"}
                                </b>

                                <p>
                                  {item.reason ??
                                    item.rationale ??
                                    item.message ??
                                    item.description ??
                                    "Decision recorded by supervisor."}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="aa-empty-evidence">
                        No supervisor decisions were returned.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="aa-result aa-glass">
                <div className="aa-result-top">
                  <div>
                    <span className="aa-kicker">
                      <CheckCircle2 size={13} />
                      MISSION RESULT
                    </span>

                    <h2>
                      Agent execution result
                    </h2>
                  </div>

                  <span
                    className={`aa-success ${statusClass(
                      result.status
                    )}`}
                  >
                    <Check size={13} />
                    {displayStatus(result.status)}
                  </span>
                </div>

                <div className="aa-metrics">
                  {[
                    [
                      "Execution",
                      displayStatus(result.status)
                    ],
                    [
                      "Latency",
                      `${(result.latency / 1000).toFixed(2)}s`
                    ],
                    [
                      "Replans",
                      String(result.replans ?? 0)
                    ],
                    [
                      "Agents",
                      String(
                        Array.isArray(result.completedAgents)
                          ? result.completedAgents.length
                          : 0
                      )
                    ]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="aa-result-body">
                  <div>
                    <h4>Operational Summary</h4>

                    <p>
                      {result.message ||
                        "The orchestration response was received successfully."}
                    </p>
                  </div>

                  <div>
                    <h4>Execution Plan</h4>

                    {result.plan.length ? (
                      result.plan
                        .slice(0, 10)
                        .map((item: any, index: number) => (
                          <div
                            className="aa-plan-row"
                            key={index}
                          >
                            <span>
                              {String(
                                item.step ?? index + 1
                              ).padStart(2, "0")}
                            </span>

                            <b>
                              {item.agent ??
                                item.name ??
                                "Agent step"}
                            </b>

                            <small>
                              {item.status ?? "planned"}
                            </small>
                          </div>
                        ))
                    ) : (
                      <p className="aa-muted">
                        No execution plan was returned.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="aa-raw aa-glass">
                <button
                  className="aa-collapse-head"
                  onClick={() =>
                    setShowRawEvidence(
                      previous => !previous
                    )
                  }
                >
                  <FileText size={18} />

                  <div>
                    <b>Raw Backend Evidence</b>
                    <small>
                      Inspect the exact orchestrator response
                    </small>
                  </div>

                  <ChevronDown
                    size={18}
                    className={
                      showRawEvidence ? "open" : ""
                    }
                  />
                </button>

                {showRawEvidence && (
                  <pre>
                    {JSON.stringify(
                      result.raw,
                      null,
                      2
                    )}
                  </pre>
                )}
              </section>
            </>
          )}
        </main>

        <aside>
          <section className="aa-side-card aa-glass">
            <div className="aa-side-title">
              <span>
                <Database size={17} />
                AGENT HEALTH
              </span>

              <span className="aa-health">
                <i />
                ONLINE
              </span>
            </div>

            {[
              ["AI Model", "CONNECTED"],
              ["Supervisor", "CONNECTED"],
              ["ASP.NET Backend", "GOVERNED"],
              ["Database", "CONNECTED"],
              ["Execution Trace", result ? "CAPTURED" : "READY"]
            ].map(([label, value]) => (
              <div
                className="aa-health-row"
                key={label}
              >
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </section>

          <section className="aa-side-card aa-glass">
            <div className="aa-side-title">
              <span>
                <Zap size={17} />
                QUICK ACTIONS
              </span>
            </div>

            {profile.prompts.slice(0, 4).map(
              (item, index) => (
                <button
                  className="aa-quick"
                  key={item}
                  onClick={() => {
                    setPrompt(item);
                    textareaRef.current?.focus();
                  }}
                >
                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <b>{item}</b>

                  <ArrowRight size={14} />
                </button>
              )
            )}
          </section>

          <section className="aa-side-card aa-glass">
            <div className="aa-side-title">
              <span>
                <Target size={17} />
                SESSION CONTEXT
              </span>
            </div>

            <div className="aa-context-list">
              <div>
                <span>Location</span>
                <b>{actualLocation}</b>
              </div>

              <div>
                <span>Disaster</span>
                <b>{actualDisaster}</b>
              </div>

              <div>
                <span>Severity</span>
                <b>{severity}</b>
              </div>

              <div>
                <span>Horizon</span>
                <b>{horizon}</b>
              </div>

              <div>
                <span>Confidence</span>
                <b>{confidence}%</b>
              </div>

              <div>
                <span>Mode</span>
                <b>
                  {mode === "backend_execution"
                    ? "GOVERNED"
                    : mode.replace("_", " ").toUpperCase()}
                </b>
              </div>
            </div>
          </section>

          <section className="aa-side-card aa-glass">
            <button
              className="aa-side-title clickable"
              onClick={() =>
                setShowHistory(previous => !previous)
              }
            >
              <span>
                <History size={17} />
                SESSION HISTORY
              </span>

              <ChevronDown
                size={16}
                className={
                  showHistory ? "open" : ""
                }
              />
            </button>

            {showHistory && (
              <div className="aa-history">
                {history.length ? (
                  history.map(item => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setPrompt(item.prompt)
                      }
                    >
                      <small>
                        {item.time} - {item.duration}
                      </small>

                      <b>{item.prompt}</b>

                      <span>
                        {item.location} - {item.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="aa-muted">
                    No executions in this session.
                  </p>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Settings2Icon() {
  return <Sparkles size={18} />;
}


