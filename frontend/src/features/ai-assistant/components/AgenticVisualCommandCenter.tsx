import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cpu,
  GitBranch,
  MapPinned,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  Boxes,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/agentic-ui.css";

const FLOOD_PHOTO =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg/1024px-Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg";

const agents = [
  { id: "01", name: "Risk Prediction", label: "Risk Intelligence", icon: Activity },
  { id: "02", name: "Vulnerability & Impact", label: "Community Exposure", icon: ShieldCheck },
  { id: "03", name: "Resource Optimization", label: "Relief Capacity", icon: Boxes },
  { id: "04", name: "Early Warning", label: "Warning & Coordination", icon: Radio },
  { id: "05", name: "Volunteer Assignment", label: "Response Network", icon: Users },
];

export default function AgenticVisualCommandCenter({
  compact = false,
  selectedAgent = "Risk Prediction",
}: {
  compact?: boolean;
  selectedAgent?: string;
}) {
  const navigate = useNavigate();

  const normalizedSelectedAgent = selectedAgent
    .replace(" & Coordination", "")
    .replace(" Agent", "")
    .trim()
    .toLowerCase();

  const activeAgent =
    agents.find((agent) => {
      const normalizedName = agent.name.toLowerCase();

      return (
        normalizedName === normalizedSelectedAgent ||
        normalizedName.includes(normalizedSelectedAgent) ||
        normalizedSelectedAgent.includes(normalizedName)
      );
    }) ?? agents[0];

  const steps = useMemo(
    () => [
      ["Understand goal", "AI Supervisor interprets the operational request.", BrainCircuit],
      ["Select tools", "Weather, river, hazard, population and resource context.", Waves],
      ["Execute agents", "Governed backend executes the selected specialist agents.", Cpu],
      ["Observe & critique", "Results are validated before the next decision.", GitBranch],
      ["Re-plan when needed", "The supervisor adapts the workflow to new state.", Sparkles],
    ] as const,
    [],
  );

  return (
    <section className={`rn-agentic-shell ${compact ? "rn-agentic-shell--compact" : ""}`}>
      {!compact && (
        <div className="rn-agentic-hero">
          <div className="rn-agentic-photo" style={{ backgroundImage: `url("${FLOOD_PHOTO}")` }} />
          <div className="rn-agentic-photo-overlay" />
          <div className="rn-agentic-grid" />

          <div className="rn-agentic-hero-copy">
            <div className="rn-agentic-kicker">
              <span className="rn-live-dot" />
              LIVE AGENTIC OPERATIONS
            </div>
            <h2>
              One command center.
              <span> Five specialist agents.</span>
            </h2>
            <p>
              ReliefNexus turns an operational goal into a dynamic plan, observes
              each result and adapts the response while keeping high-impact actions
              behind human governance.
            </p>

            <div className="rn-agentic-hero-actions">
              <button type="button" onClick={() => navigate("/dashboard/system-administrator/ai-agents")}>
                Open AI Operations <ChevronRight size={16} />
              </button>
              <span><MapPinned size={14} /> Colombo response scenario</span>
            </div>
          </div>

          <div className="rn-agentic-robot-stage" aria-hidden="true">
            <div className="rn-orbit-ring rn-orbit-ring-a" />
            <div className="rn-orbit-ring rn-orbit-ring-b" />
            <div className="rn-robot">
              <div className="rn-robot-antenna" />
              <div className="rn-robot-head">
                <div className="rn-robot-ear rn-robot-ear-left" />
                <div className="rn-robot-ear rn-robot-ear-right" />
                <div className="rn-robot-eye rn-robot-eye-left" />
                <div className="rn-robot-eye rn-robot-eye-right" />
                <div className="rn-robot-mouth" />
              </div>
              <div className="rn-robot-body">
                <div className="rn-robot-core"><Sparkles size={17} /></div>
                <div className="rn-robot-line" />
              </div>
              <div className="rn-robot-arm rn-robot-arm-left" />
              <div className="rn-robot-arm rn-robot-arm-right" />
            </div>
            <div className="rn-robot-status">
              <span className="rn-live-dot" /> SUPERVISOR ONLINE
            </div>
          </div>

          <div className="rn-agentic-credit">
            Real disaster-response photo ? CC BY 2.0 ? Wikimedia Commons
          </div>
        </div>
      )}

      <div className="rn-agentic-workflow">
        <div className="rn-agentic-section-head">
          <div>
            <span className="rn-agentic-mini-label">SUPERVISED AGENTIC LOOP</span>
            <h3>Goal ??' Plan ??' Act ??' Observe ??' Re-plan</h3>
          </div>
          <div className="rn-supervisor-pill">
            <CircleDot size={14} /> ASP.NET governed execution
          </div>
        </div>

        <div className="rn-agentic-loop">
          {steps.map(([title, text, Icon], index) => (
            <div className="rn-loop-step" key={title}>
              <div className="rn-loop-icon"><Icon size={17} /></div>
              <div>
                <strong>{index + 1}. {title}</strong>
                <span>{text}</span>
              </div>
              {index < steps.length - 1 && <ChevronRight className="rn-loop-arrow" size={17} />}
            </div>
          ))}
        </div>

        <div className="rn-agent-grid">
          {agents.map((agent, index) => {
            const Icon = agent.icon;
            return (
              <div
                className={`rn-agent-card ${
                  activeAgent.id === agent.id
                    ? "rn-agent-card--active"
                    : ""
                }`}
                key={agent.id}
              >
                <div className="rn-agent-card-top">
                  <div className={`rn-agent-avatar rn-agent-avatar-${index + 1}`}>
                    <Icon size={18} />
                    <span>{agent.id}</span>
                  </div>
                  <span className="rn-agent-state"><span /> Ready</span>
                </div>
                <strong>Agent {agent.id}</strong>
                <b>{agent.name}</b>
                <span>{agent.label}</span>
                <div className="rn-agent-progress">
                  <i style={{ width: `${72 + index * 5}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rn-active-agent-panel">
          <div className="rn-active-agent-panel__header">
            <div>
              <span className="rn-agentic-mini-label">
                ACTIVE AI AGENT
              </span>

              <h3>
                Agent {activeAgent.id} ??" {activeAgent.name}
              </h3>

              <p>
                {activeAgent.label}
              </p>
            </div>

            <div className="rn-supervisor-pill">
              <CircleDot size={14} />
              SUPERVISOR SELECTED
            </div>
          </div>

          <div className="rn-active-agent-panel__grid">
            <div>
              <span>AI Reasoning</span>
              <strong>
                Interpreting the operational state and selecting the next governed action.
              </strong>
            </div>

            <div>
              <span>Dynamic Plan</span>
              <strong>
                Goal ??' Plan ??' Execute ??' Observe ??' Re-plan
              </strong>
            </div>

            <div>
              <span>Execution Authority</span>
              <strong>
                ASP.NET governed backend
              </strong>
            </div>

            <div>
              <span>Governance</span>
              <strong>
                High-impact actions remain behind human approval.
              </strong>
            </div>
          </div>
        </div>

        <div className="rn-governance-row">
          <div><ShieldCheck size={17} /><span><b>Human governance</b> High-impact actions require approval.</span></div>
          <div><AlertTriangle size={17} /><span><b>Action boundary</b> AI recommends; backend authorizes and executes.</span></div>
          <div><CheckCircle2 size={17} /><span><b>Traceability</b> Every execution remains observable.</span></div>
        </div>
      </div>
    </section>
  );
}


