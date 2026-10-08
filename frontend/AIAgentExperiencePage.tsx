import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Cpu,
  Gauge,
  GitBranch,
  MapPinned,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";

type AgentKey =
  | "risk"
  | "vulnerability"
  | "resource"
  | "warning"
  | "volunteer";

type AgentConfig = {
  key: AgentKey;
  number: string;
  name: string;
  subtitle: string;
  eyebrow: string;
  description: string;
  icon: typeof Activity;
  photo: string;
  accent: string;
  location: string;
  metrics: Array<{ value: string; label: string }>;
  steps: string[];
};

const rescuePhoto =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg/1024px-Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg";

const floodMap =
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flood_map,_western_Sri_Lanka_ESA360995.jpg";

const reliefPhoto =
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_aid_for_the_2016_Sri_Lankan_floods_(3).jpg";

const operationPhoto =
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Navy_flood_relief_operations_in_the_aftermath_of_floods_and_landslides_in_Sri_Lanka,_May_2017_(07).jpg";

const AGENTS: AgentConfig[] = [
  {
    key: "risk",
    number: "01",
    name: "Risk Prediction",
    subtitle: "Risk Intelligence",
    eyebrow: "RISK INTELLIGENCE",
    description:
      "Predict hazard probability, risk severity and confidence from the current disaster context.",
    icon: Activity,
    photo: floodMap,
    accent: "#1aa7ff",
    location: "Colombo · Western Province",
    metrics: [
      { value: "72%", label: "Risk score" },
      { value: "HIGH", label: "Risk level" },
      { value: "94%", label: "Confidence" },
      { value: "LIVE", label: "Model state" },
    ],
    steps: [
      "Collect hazard context",
      "Evaluate rainfall & water level",
      "Generate risk score",
      "Validate prediction",
    ],
  },
  {
    key: "vulnerability",
    number: "02",
    name: "Vulnerability & Impact",
    subtitle: "Community Exposure",
    eyebrow: "COMMUNITY EXPOSURE",
    description:
      "Assess exposed communities, vulnerable groups and expected human impact before response decisions.",
    icon: ShieldCheck,
    photo: rescuePhoto,
    accent: "#8b5cf6",
    location: "Colombo · Flood exposure",
    metrics: [
      { value: "18.4K", label: "People exposed" },
      { value: "64%", label: "Vulnerability" },
      { value: "HIGH", label: "Severity" },
      { value: "LIVE", label: "Assessment" },
    ],
    steps: [
      "Load risk prediction",
      "Map vulnerable population",
      "Estimate impact",
      "Rank critical exposure",
    ],
  },
  {
    key: "resource",
    number: "03",
    name: "Resource Optimization",
    subtitle: "Relief Capacity",
    eyebrow: "RELIEF CAPACITY",
    description:
      "Compare demand against available relief resources and recommend priority allocations.",
    icon: Boxes,
    photo: reliefPhoto,
    accent: "#10b981",
    location: "Colombo · Relief network",
    metrics: [
      { value: "1,240", label: "Available units" },
      { value: "860", label: "Required units" },
      { value: "82%", label: "Coverage" },
      { value: "OPT", label: "Optimizer state" },
    ],
    steps: [
      "Assess resource demand",
      "Inspect available stock",
      "Prioritize shortages",
      "Recommend allocation",
    ],
  },
  {
    key: "warning",
    number: "04",
    name: "Early Warning & Coordination",
    subtitle: "Emergency Intelligence",
    eyebrow: "EARLY WARNING",
    description:
      "Prepare emergency warnings and coordination actions while keeping high-impact actions behind human approval.",
    icon: Radio,
    photo: operationPhoto,
    accent: "#f97316",
    location: "Colombo · Emergency operations",
    metrics: [
      { value: "14", label: "Zones monitored" },
      { value: "HIGH", label: "Alert priority" },
      { value: "01", label: "Approval gate" },
      { value: "LOCKED", label: "Action state" },
    ],
    steps: [
      "Prepare warning context",
      "Build alert recommendation",
      "Request human approval",
      "Activate approved action",
    ],
  },
  {
    key: "volunteer",
    number: "05",
    name: "Volunteer Assignment",
    subtitle: "Response Network",
    eyebrow: "RESPONSE NETWORK",
    description:
      "Build a response network by matching volunteers and teams to operational requirements.",
    icon: Users,
    photo: operationPhoto,
    accent: "#06b6d4",
    location: "Colombo · Field response",
    metrics: [
      { value: "128", label: "Volunteers" },
      { value: "42", label: "Assigned" },
      { value: "18", label: "Teams ready" },
      { value: "LIVE", label: "Network state" },
    ],
    steps: [
      "Read response requirements",
      "Check volunteer availability",
      "Match skills & zones",
      "Prepare assignment plan",
    ],
  },
];

const normalizeAgent = (value?: string): AgentConfig => {
  const v = String(value ?? "").toLowerCase();

  if (v.includes("vulnerability")) return AGENTS[1];
  if (v.includes("resource")) return AGENTS[2];
  if (v.includes("warning")) return AGENTS[3];
  if (v.includes("volunteer")) return AGENTS[4];

  return AGENTS[0];
};

export default function AIAgentExperiencePage({
  agent = "risk",
}: {
  agent?: AgentKey;
}) {
  const config = useMemo(
    () => AGENTS.find((item) => item.key === agent) ?? AGENTS[0],
    [agent],
  );

  const Icon = config.icon;
  const [activity, setActivity] = useState(68);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    setActivity(68);
    setActiveStep(1);

    const timer = window.setInterval(() => {
      setActivity((current) => (current >= 96 ? 62 : current + 4));
      setActiveStep((current) =>
        current >= config.steps.length ? 1 : current + 1,
      );
    }, 1800);

    return () => window.clearInterval(timer);
  }, [config]);

  return (
    <div className="rn-agent-page">
      <section
        className="rn-agent-hero"
        style={{ "--rn-accent": config.accent } as React.CSSProperties}
      >
        <div
          className="rn-agent-hero-photo"
          style={{ backgroundImage: `url("${config.photo}")` }}
        />
        <div className="rn-agent-hero-overlay" />
        <div className="rn-agent-grid-bg" />

        <div className="rn-agent-hero-content">
          <div className="rn-agent-breadcrumb">
            <span>AI OPERATIONS</span>
            <ArrowRight size={12} />
            <b>AGENT {config.number}</b>
          </div>

          <div className="rn-agent-live">
            <span />
            LIVE AI AGENT
          </div>

          <div className="rn-agent-title-row">
            <div className="rn-agent-title-icon">
              <Icon size={28} />
            </div>

            <div>
              <p>{config.eyebrow}</p>
              <h1>{config.name}</h1>
              <span>{config.subtitle}</span>
            </div>
          </div>

          <p className="rn-agent-hero-description">
            {config.description}
          </p>

          <div className="rn-agent-location">
            <MapPinned size={14} />
            {config.location}
            <span className="separator" />
            <span className="status-dot" />
            Supervisor online
          </div>
        </div>

        <div className="rn-agent-orbit">
          <div className="rn-orbit orbit-a" />
          <div className="rn-orbit orbit-b" />
          <div className="rn-orbit-core">
            <Icon size={44} />
            <span>AGENT {config.number}</span>
          </div>
        </div>

        <div className="rn-agent-hero-metrics">
          {config.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rn-agent-body">
        <div className="rn-agent-heading">
          <div>
            <span>INTELLIGENT EXECUTION WORKSPACE</span>
            <h2>Agent intelligence & execution</h2>
            <p>
              Observe the specialist agent, its current reasoning stage,
              execution progress and governance boundary.
            </p>
          </div>

          <div className="rn-agent-state">
            <span />
            PROCESSING
          </div>
        </div>

        <div className="rn-agent-main-grid">
          <div className="rn-agent-card rn-agent-card-large">
            <div className="rn-card-heading">
              <div>
                <span className="rn-mini-label">AI REASONING</span>
                <h3>Current agent decision</h3>
              </div>
              <BrainCircuit size={20} />
            </div>

            <div className="rn-reasoning">
              <div className="rn-reasoning-scan" />

              <div className="rn-reasoning-icon">
                <Sparkles size={23} />
              </div>

              <div>
                <small>SUPERVISOR OBSERVATION</small>
                <strong>
                  Evaluating operational state and selecting the
                  next governed action.
                </strong>
                <p>
                  Agent {config.number} is observing its assigned
                  context and preparing the next execution step.
                </p>
              </div>
            </div>

            <div className="rn-activity-bar">
              <div>
                <span>Agent activity</span>
                <b>{activity}%</b>
              </div>
              <div className="rn-progress">
                <i style={{ width: `${activity}%` }} />
              </div>
            </div>
          </div>

          <div className="rn-agent-card">
            <div className="rn-card-heading">
              <div>
                <span className="rn-mini-label">LIVE STATUS</span>
                <h3>Agent health</h3>
              </div>
              <Gauge size={20} />
            </div>

            <div className="rn-health-list">
              <div>
                <span>Model</span>
                <b>ONLINE</b>
              </div>
              <div>
                <span>Supervisor</span>
                <b>CONNECTED</b>
              </div>
              <div>
                <span>Backend</span>
                <b>GOVERNED</b>
              </div>
              <div>
                <span>Trace</span>
                <b>RECORDING</b>
              </div>
            </div>
          </div>
        </div>

        <div className="rn-agent-card rn-pipeline-card">
          <div className="rn-card-heading">
            <div>
              <span className="rn-mini-label">DYNAMIC EXECUTION</span>
              <h3>Goal → Plan → Execute → Observe → Re-plan</h3>
            </div>
            <GitBranch size={20} />
          </div>

          <div className="rn-agent-pipeline">
            {config.steps.map((step, index) => {
              const active = activeStep === index + 1;

              return (
                <div
                  className={`rn-pipeline-step ${
                    active ? "is-active" : ""
                  }`}
                  key={step}
                >
                  <div className="rn-pipeline-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <small>
                      {active ? "CURRENT" : `STEP ${index + 1}`}
                    </small>
                    <strong>{step}</strong>
                  </div>

                  {index < config.steps.length - 1 && (
                    <ArrowRight className="rn-pipeline-arrow" size={16} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rn-agent-bottom-grid">
          <div className="rn-agent-card">
            <div className="rn-card-heading">
              <div>
                <span className="rn-mini-label">EXECUTION AUTHORITY</span>
                <h3>Governed backend</h3>
              </div>
              <Cpu size={20} />
            </div>

            <div className="rn-authority">
              <CheckCircle2 size={20} />
              <div>
                <strong>ASP.NET governed execution</strong>
                <span>
                  AI recommends. The backend validates permissions
                  and executes approved actions.
                </span>
              </div>
            </div>
          </div>

          <div className="rn-agent-card">
            <div className="rn-card-heading">
              <div>
                <span className="rn-mini-label">GOVERNANCE</span>
                <h3>Human approval boundary</h3>
              </div>
              <ShieldCheck size={20} />
            </div>

            <div className="rn-authority rn-authority-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>High-impact actions are protected</strong>
                <span>
                  Emergency actions remain blocked until the required
                  human approval is recorded.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rn-agent-footer-strip">
          <div>
            <Clock3 size={15} />
            <span>Continuous observation</span>
          </div>
          <div>
            <Radio size={15} />
            <span>Real-time agent state</span>
          </div>
          <div>
            <Waves size={15} />
            <span>Adaptive response workflow</span>
          </div>
          <div>
            <CheckCircle2 size={15} />
            <span>Auditable execution trace</span>
          </div>
        </div>

        <p className="rn-photo-credit">
          Disaster-response imagery: Wikimedia Commons / respective
          source licensing. Operational metrics shown in the interface
          are presentation values until populated by live API state.
        </p>
      </section>
    </div>
  );
}
