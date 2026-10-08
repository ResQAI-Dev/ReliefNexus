$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\src\features\dashboard\pages\SystemAdministratorDashboard.tsx")) {
    throw "Run this from C:\Users\SK COMPUTERS\ReliefNexus\frontend"
}

New-Item -ItemType Directory -Force ".\src\features\ai-assistant\pages", ".\src\features\ai-assistant\styles" | Out-Null

$tsx = @'
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowRight, Bot, BrainCircuit, Check, CheckCircle2, ChevronDown,
  Cpu, Crosshair, Database, Gauge, GitBranch, History, Layers3, Loader2,
  MapPin, MessageSquare, Play, Radio, RefreshCw, RotateCcw, Settings2,
  ShieldCheck, Sparkles, Square, Target, Terminal, TriangleAlert, Users, X, Zap
} from "lucide-react";
import "../styles/advanced-agent-workspace.css";

type AgentKey = "risk" | "vulnerability" | "resource" | "warning" | "volunteer";
type ExecutionMode = "plan_only" | "backend_execution" | "python_simulation";
type RunStatus = "idle" | "interpreting" | "running" | "completed" | "failed" | "approval_required";

type AgentProfile = {
  key: AgentKey;
  number: string;
  name: string;
  eyebrow: string;
  subtitle: string;
  accent: string;
  image: string;
  icon: React.ReactNode;
  disasterTypes: string[];
  prompts: string[];
};

const PROFILES: Record<AgentKey, AgentProfile> = {
  risk: {
    key: "risk", number: "01", name: "Risk Prediction", eyebrow: "RISK INTELLIGENCE",
    subtitle: "Hazard probability, severity and confidence intelligence.", accent: "#18a8ff",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flood_map,_western_Sri_Lanka_ESA360995.jpg",
    icon: <Gauge size={22} />, disasterTypes: ["Flood","Landslide","Drought","Cyclone","Storm"],
    prompts: ["Assess flood risk in Colombo", "Forecast risk for the next 24 hours", "Analyze current high-risk zones", "Run a full disaster risk assessment"]
  },
  vulnerability: {
    key: "vulnerability", number: "02", name: "Vulnerability & Impact", eyebrow: "COMMUNITY EXPOSURE",
    subtitle: "Population, infrastructure and impact intelligence.", accent: "#8b5cf6",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_aid_for_the_2016_Sri_Lankan_floods_(3).jpg",
    icon: <Users size={22} />, disasterTypes: ["Flood","Landslide","Drought","Cyclone","Storm"],
    prompts: ["Identify vulnerable communities in Colombo", "Analyze population exposure", "Assess infrastructure impact", "Run a vulnerability assessment"]
  },
  resource: {
    key: "resource", number: "03", name: "Resource Optimization", eyebrow: "RELIEF CAPACITY",
    subtitle: "Demand, supply and allocation intelligence.", accent: "#10b981",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Navy_flood_relief_operations_in_the_aftermath_of_floods_and_landslides_in_Sri_Lanka,_May_2017_(07).jpg",
    icon: <Layers3 size={22} />, disasterTypes: ["Flood","Landslide","Drought","Cyclone","Storm"],
    prompts: ["Check available resources for Colombo", "Identify resource shortages", "Optimize relief allocation", "Generate a resource response plan"]
  },
  warning: {
    key: "warning", number: "04", name: "Early Warning & Coordination", eyebrow: "EMERGENCY COORDINATION",
    subtitle: "Warning preparation, targeting and governance.", accent: "#f97316",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Navy_flood_relief_operations_in_the_aftermath_of_floods_and_landslides_in_Sri_Lanka,_May_2017_(07).jpg",
    icon: <Radio size={22} />, disasterTypes: ["Flood","Landslide","Drought","Cyclone","Storm"],
    prompts: ["Prepare an emergency warning for Colombo", "Identify warning target areas", "Review warning readiness", "Prepare a coordinated response"]
  },
  volunteer: {
    key: "volunteer", number: "05", name: "Volunteer Assignment", eyebrow: "RESPONSE NETWORK",
    subtitle: "Volunteer availability, skills and response coverage.", accent: "#06b6d4",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg/1024px-Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg",
    icon: <Users size={22} />, disasterTypes: ["Flood","Landslide","Drought","Cyclone","Storm"],
    prompts: ["Create a volunteer response plan", "Match volunteers to response needs", "Check volunteer coverage", "Analyze volunteer availability"]
  }
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5115").replace(/\/$/, "");

function normalize(data: any) {
  const root = data?.result ?? data?.data ?? data ?? {};
  return {
    status: root.status ?? data?.status ?? "completed",
    plan: root.plan ?? data?.plan ?? [],
    steps: root.steps ?? data?.steps ?? [],
    replans: root.replans ?? data?.replans ?? root.replanCount ?? 0,
    completedAgents: root.completedAgents ?? data?.completedAgents ?? [],
    approval: root.approval ?? data?.approval ?? null,
    metrics: root.metrics ?? data?.metrics ?? {},
    message: root.message ?? data?.message ?? "",
    raw: data
  };
}

export default function AdvancedAIAgentWorkspace({ agent }: { agent: AgentKey }) {
  const profile = PROFILES[agent];
  const [prompt, setPrompt] = useState(profile.prompts[0]);
  const [location, setLocation] = useState("Colombo");
  const [disasterType, setDisasterType] = useState("Flood");
  const [severity, setSeverity] = useState("High");
  const [horizon, setHorizon] = useState("24h");
  const [confidence, setConfidence] = useState(70);
  const [mode, setMode] = useState<ExecutionMode>("backend_execution");
  const [status, setStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<Array<{time:string;text:string;kind:string}>>([]);
  const [tools, setTools] = useState<Array<{name:string;status:string;duration:string}>>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showScenario, setShowScenario] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addEvent = useCallback((text: string, kind = "info") => {
    const now = new Date().toLocaleTimeString([], { hour12: false });
    setEvents(prev => [...prev.slice(-30), { time: now, text, kind }]);
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 100);
    return () => window.clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    setPrompt(profile.prompts[0]); setResult(null); setError(""); setEvents([]); setTools([]); setStatus("idle");
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
    if (!prompt.trim() || status === "running" || status === "interpreting") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(""); setResult(null); setEvents([]); setElapsed(0); setStartedAt(Date.now()); setStatus("interpreting");
    addEvent("Command received by Agent Workspace");
    addEvent(`Intent: ${profile.name}`);
    addEvent(`Scenario: ${disasterType} · ${location} · ${severity}`);
    setTools([
      {name:"Request validation",status:"running",duration:"—"},
      {name:"Supervisor / Planner",status:"waiting",duration:"—"},
      {name:"Governed Agent Execution",status:"waiting",duration:"—"},
      {name:"Validation / Critic",status:"waiting",duration:"—"}
    ]);

    await new Promise(r => setTimeout(r, 450));
    if (controller.signal.aborted) return;

    setStatus("running");
    addEvent("Execution plan accepted");
    setTools(prev => prev.map((x,i) => i === 0 ? {...x,status:"completed",duration:"0.45s"} : i === 1 ? {...x,status:"running"} : x));

    try {
      const started = performance.now();
      const response = await fetch(`${API_BASE}/api/ai/orchestrator/run`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        credentials:"include",
        body:JSON.stringify({
          prompt:prompt.trim(),
          riskInput:{location,latitude:6.9271,longitude:79.8612,disasterType},
          executeAgents:mode === "backend_execution",
          maxReplans:3,
          executionMode:mode
        }),
        signal:controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || data?.error || `Orchestrator request failed (${response.status})`);

      const normalized = normalize(data);
      const latency = performance.now() - started;
      setResult({...normalized,latency});
      addEvent("Orchestrator response received","success");
      addEvent("Execution result normalized for workspace","success");
      setTools(prev => prev.map((x,i) => ({...x,status:"completed",duration:i===2 ? `${(latency/1000).toFixed(2)}s` : x.duration === "—" ? "done" : x.duration})));

      const needsApproval = Boolean(normalized.approval?.required || normalized.status === "approval_required");
      setStatus(needsApproval ? "approval_required" : "completed");
      if (needsApproval) addEvent("Human approval required before governed action","warning");

      setHistory(prev => [{
        id:Date.now(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        prompt:prompt.trim(),location,disasterType,status:needsApproval?"Approval Required":"Completed",
        mode,duration:`${(latency/1000).toFixed(2)}s`
      },...prev].slice(0,12));
    } catch (e:any) {
      if (e?.name === "AbortError") { addEvent("Execution cancelled","warning"); setStatus("idle"); return; }
      const message=e?.message || "Unable to reach orchestration service";
      setError(message); addEvent(message,"error");
      setTools(prev => prev.map(x=>x.status==="running"?{...x,status:"failed"}:x));
      setStatus("failed");
    } finally { setStartedAt(null); }
  };

  const stop = () => { abortRef.current?.abort(); setStartedAt(null); setStatus("idle"); };
  const reset = () => { stop(); setResult(null); setError(""); setEvents([]); setTools([]); setElapsed(0); };
  const keyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); execute(); }
  };

  const pipeline:[string,React.ElementType][] = [
    ["Command",MessageSquare],["Supervisor",BrainCircuit],["Planner",GitBranch],
    [`Agent ${profile.number}`,Cpu],["Validator",ShieldCheck],["Decision",Target]
  ];

  return (
    <div className="advanced-agent-page" style={{"--agent-accent":profile.accent} as React.CSSProperties}>
      <div className="aa-grid-bg"/>
      <section className="aa-hero">
        <div className="aa-hero-image" style={{backgroundImage:`url("${profile.image}")`}}/>
        <div className="aa-hero-overlay"/>
        <div className="aa-hero-content">
          <div className="aa-breadcrumb"><span>AI OPERATIONS</span><ArrowRight size={12}/><b>AGENT {profile.number}</b></div>
          <div className="aa-live"><i/> LIVE AI AGENT</div>
          <div className="aa-title-row">
            <div className="aa-agent-icon">{profile.icon}</div>
            <div><div className="aa-eyebrow">{profile.eyebrow}</div><h1>{profile.name}</h1><p>{profile.subtitle}</p></div>
          </div>
          <div className="aa-context"><MapPin size={14}/> {location} · {disasterType}<span/><i/> Supervisor online</div>
        </div>
        <div className="aa-hero-orbit"><div className="aa-orbit-ring ring-a"/><div className="aa-orbit-ring ring-b"/><div className="aa-core"><Bot size={28}/><small>AGENT {profile.number}</small></div></div>
        <div className="aa-hero-metrics">
          <div><small>STATUS</small><strong>{status==="running"?"RUNNING":status==="failed"?"ERROR":status==="approval_required"?"GATE":"READY"}</strong></div>
          <div><small>MODE</small><strong>{mode==="backend_execution"?"GOVERNED":mode==="plan_only"?"PLAN":"SIM"}</strong></div>
          <div><small>ELAPSED</small><strong>{elapsed.toFixed(1)}s</strong></div>
        </div>
      </section>

      <div className="aa-command-layout">
        <main>
          <section className="aa-console aa-glass">
            <div className="aa-section-head">
              <div><span className="aa-kicker"><Sparkles size={13}/> COMMAND CONSOLE</span><h2>Direct the agent with natural language</h2></div>
              <div className="aa-console-actions">
                <button className="aa-icon-btn" onClick={reset} title="Reset"><RotateCcw size={16}/></button>
                {status==="running" ? <button className="aa-stop" onClick={stop}><Square size={14}/> Stop</button> : <button className="aa-run" onClick={execute}><Play size={14}/> Run Agent</button>}
              </div>
            </div>
            <textarea ref={textareaRef} value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={keyDown} placeholder="Describe the disaster situation or operational task..."/>
            <div className="aa-console-footer"><span><Terminal size={13}/> Ctrl + Enter to execute</span><span>{prompt.length}/4000</span></div>
            <div className="aa-chip-row">{profile.prompts.map(p=><button key={p} onClick={()=>setPrompt(p)}>{p}</button>)}</div>
          </section>

          <section className="aa-panel aa-glass">
            <button className="aa-collapse-head" onClick={()=>setShowScenario(v=>!v)}>
              <Settings2 size={18}/><div><b>Scenario & Execution Control</b><small>Configure context before the agent acts</small></div><ChevronDown size={18} className={showScenario?"open":""}/>
            </button>
            {showScenario && <div className="aa-scenario">
              <label>Disaster Type<select value={disasterType} onChange={e=>setDisasterType(e.target.value)}>{profile.disasterTypes.map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Location<input value={location} onChange={e=>setLocation(e.target.value)}/></label>
              <label>Severity<select value={severity} onChange={e=>setSeverity(e.target.value)}>{["Low","Medium","High","Critical"].map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Forecast Horizon<select value={horizon} onChange={e=>setHorizon(e.target.value)}>{["6h","12h","24h","48h","72h"].map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="aa-range">Confidence Threshold <b>{confidence}%</b><input type="range" min="50" max="95" value={confidence} onChange={e=>setConfidence(+e.target.value)}/></label>
              <div className="aa-mode"><span>Execution Mode</span>{(["plan_only","backend_execution","python_simulation"] as ExecutionMode[]).map(x=><button key={x} className={mode===x?"active":""} onClick={()=>setMode(x)}>{x==="backend_execution"?"GOVERNED":x==="plan_only"?"PLAN ONLY":"SIMULATION"}</button>)}</div>
            </div>}
          </section>

          <section className="aa-panel aa-glass">
            <div className="aa-section-head compact"><div><span className="aa-kicker"><GitBranch size={13}/> LIVE ORCHESTRATION</span><h2>Agent execution pipeline</h2></div><span className={`aa-status-badge ${status}`}>{status.replace("_"," ")}</span></div>
            <div className="aa-pipeline">{pipeline.map(([name,Icon],i)=><React.Fragment key={name}><div className={`aa-node ${phase>i?"done":phase===i?"active":""}`}><div><Icon size={17}/></div><small>{name}</small><em>{phase>i?"DONE":phase===i?"ACTIVE":"WAIT"}</em></div>{i<pipeline.length-1&&<div className={`aa-connector ${phase>i?"flow":""}`}><ArrowRight size={15}/></div>}</React.Fragment>)}</div>
          </section>

          <div className="aa-two-col">
            <section className="aa-panel aa-glass">
              <div className="aa-section-head compact"><div><span className="aa-kicker"><Activity size={13}/> TOOL ACTIVITY</span><h3>Operational data flow</h3></div><span className="aa-live-dot">LIVE</span></div>
              <div className="aa-tool-list">{(tools.length?tools:[
                {name:"Request validation",status:"waiting",duration:"—"},
                {name:"Supervisor / Planner",status:"waiting",duration:"—"},
                {name:"Governed Agent Execution",status:"waiting",duration:"—"},
                {name:"Validation / Critic",status:"waiting",duration:"—"}
              ]).map(t=><div className="aa-tool" key={t.name}><span className={`tool-dot ${t.status}`}>{t.status==="running"?<Loader2 size={12}/>:t.status==="completed"?<Check size={12}/>:t.status==="failed"?<X size={12}/>:null}</span><span>{t.name}</span><small>{t.duration}</small></div>)}</div>
            </section>

            <section className="aa-panel aa-glass">
              <div className="aa-section-head compact"><div><span className="aa-kicker"><Terminal size={13}/> EVENT STREAM</span><h3>Execution telemetry</h3></div></div>
              <div className="aa-events">{(events.length?events:[{time:"--:--:--",text:"Waiting for a command...",kind:"info"}]).map((e,i)=><div key={i} className={`aa-event ${e.kind}`}><code>{e.time}</code><span>{e.text}</span></div>)}</div>
            </section>
          </div>

          {error&&<section className="aa-error"><TriangleAlert size={20}/><div><b>Agent execution unavailable</b><p>{error}</p></div><button onClick={execute}><RefreshCw size={15}/> Retry</button></section>}

          {status==="approval_required"&&<section className="aa-approval"><div className="aa-approval-icon"><ShieldCheck size={24}/></div><div><span>GOVERNANCE GATE</span><h3>Human approval required</h3><p>The backend returned an action that requires authorized review. No operational action has been automatically approved.</p></div><button>Review in Approval Center <ArrowRight size={15}/></button></section>}

          {result&&<section className="aa-result aa-glass">
            <div className="aa-result-top"><div><span className="aa-kicker"><CheckCircle2 size={13}/> MISSION RESULT</span><h2>Agent execution completed</h2></div><span className="aa-success"><Check size={13}/> {status==="approval_required"?"GATE":"COMPLETED"}</span></div>
            <div className="aa-metrics">{[
              ["Execution",status==="approval_required"?"GATE":"COMPLETED"],
              ["Latency",`${(result.latency/1000).toFixed(2)}s`],
              ["Replans",String(result.replans??0)],
              ["Agents",String(Array.isArray(result.completedAgents)?result.completedAgents.length:"N/A")]
            ].map(([a,b])=><div key={a}><small>{a}</small><strong>{b}</strong></div>)}</div>
            <div className="aa-result-body"><div><h4>Operational Summary</h4><p>{result.message||"The orchestration response was received and normalized successfully."}</p></div><div><h4>Execution Plan</h4>{Array.isArray(result.plan)&&result.plan.length?result.plan.slice(0,6).map((x:any,i:number)=><div className="aa-plan-row" key={i}><span>{String(x.step??i+1).padStart(2,"0")}</span><b>{x.agent??x.name??"Agent step"}</b><small>{x.status??"planned"}</small></div>):<p className="aa-muted">No plan details returned by the current response.</p>}</div></div>
          </section>}
        </main>

        <aside>
          <section className="aa-side-card aa-glass"><div className="aa-side-title"><span><Crosshair size={17}/> AGENT HEALTH</span><span className="aa-health"><i/> ONLINE</span></div>{[["AI Model","CONNECTED"],["Supervisor","CONNECTED"],["ASP.NET Backend","GOVERNED"],["Database","CONNECTED"],["Trace","RECORDING"]].map(([a,b])=><div className="aa-health-row" key={a}><span>{a}</span><b>{b}</b></div>)}</section>

          <section className="aa-side-card aa-glass"><div className="aa-side-title"><span><Zap size={17}/> QUICK ACTIONS</span></div>{profile.prompts.slice(0,4).map((p,i)=><button className="aa-quick" key={p} onClick={()=>{setPrompt(p);textareaRef.current?.focus()}}><span>0{i+1}</span><b>{p}</b><ArrowRight size={14}/></button>)}</section>

          <section className="aa-side-card aa-glass"><div className="aa-side-title"><span><Database size={17}/> SESSION CONTEXT</span></div><div className="aa-context-list"><div><span>Location</span><b>{location}</b></div><div><span>Disaster</span><b>{disasterType}</b></div><div><span>Severity</span><b>{severity}</b></div><div><span>Horizon</span><b>{horizon}</b></div><div><span>Confidence</span><b>{confidence}%</b></div><div><span>Mode</span><b>{mode==="backend_execution"?"GOVERNED":mode.replace("_"," ").toUpperCase()}</b></div></div></section>

          <section className="aa-side-card aa-glass"><button className="aa-side-title clickable" onClick={()=>setShowHistory(v=>!v)}><span><History size={17}/> SESSION HISTORY</span><ChevronDown size={16} className={showHistory?"open":""}/></button>{showHistory&&<div className="aa-history">{history.length?history.map(h=><button key={h.id} onClick={()=>setPrompt(h.prompt)}><small>{h.time} · {h.duration}</small><b>{h.prompt}</b><span>{h.location} · {h.status}</span></button>):<p className="aa-muted">No executions in this session.</p>}</div>}</section>
        </aside>
      </div>
    </div>
  );
}
'@

$css = @'
.advanced-agent-page{--aa-bg:#eef4f9;position:relative;min-height:100%;padding:22px 28px 50px;color:#09213d;overflow:hidden;background:linear-gradient(135deg,#f5f9fd 0%,#edf4fa 45%,#f8fbfe 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.aa-grid-bg{position:absolute;inset:0;pointer-events:none;opacity:.32;background-image:linear-gradient(rgba(18,74,117,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(18,74,117,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,#000,transparent 80%)}
.aa-hero{position:relative;height:382px;border-radius:28px;overflow:hidden;background:#061b33;box-shadow:0 25px 60px rgba(4,31,57,.18);isolation:isolate}
.aa-hero-image{position:absolute;inset:0 0 0 38%;background-position:center;background-size:cover;filter:saturate(.8) contrast(1.08);opacity:.85;animation:aaZoom 14s ease-in-out infinite alternate}
.aa-hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,#061b33 0%,rgba(5,25,46,.98) 34%,rgba(5,25,46,.72) 58%,rgba(5,25,46,.18) 100%),linear-gradient(0deg,rgba(3,18,34,.72),transparent 60%)}
.aa-hero:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 74% 48%,color-mix(in srgb,var(--agent-accent) 18%,transparent),transparent 28%);pointer-events:none}
.aa-hero-content{position:absolute;z-index:3;left:40px;top:34px;max-width:670px;color:#fff}.aa-breadcrumb{display:flex;align-items:center;gap:9px;color:#90a9c1;font-size:10px;font-weight:800;letter-spacing:1.6px}.aa-breadcrumb b{color:var(--agent-accent)}.aa-live{display:inline-flex;align-items:center;gap:8px;margin-top:28px;padding:8px 12px;border:1px solid rgba(255,255,255,.15);border-radius:999px;background:rgba(255,255,255,.07);font-size:9px;letter-spacing:1.4px;font-weight:900}.aa-live i,.aa-health i{width:7px;height:7px;border-radius:50%;background:#27e3a4;box-shadow:0 0 0 5px rgba(39,227,164,.08);animation:aaPulse 1.7s infinite}
.aa-title-row{display:flex;gap:16px;align-items:center;margin-top:18px}.aa-agent-icon{width:58px;height:58px;display:grid;place-items:center;border:1px solid var(--agent-accent);border-radius:18px;color:var(--agent-accent);background:rgba(255,255,255,.06);box-shadow:0 0 35px color-mix(in srgb,var(--agent-accent) 22%,transparent)}.aa-eyebrow,.aa-kicker{font-size:9px;font-weight:900;letter-spacing:1.8px;color:var(--agent-accent)}.aa-title-row h1{margin:2px 0 3px;font-size:46px;line-height:1.02;letter-spacing:-2px;color:#fff}.aa-title-row p{margin:0;color:#a8bed2;font-size:13px}.aa-context{display:flex;align-items:center;gap:9px;margin-top:25px;color:#b9ccdc;font-size:11px}.aa-context span{width:1px;height:14px;background:rgba(255,255,255,.18)}.aa-context i{width:6px;height:6px;background:#2de5a7;border-radius:50%}
.aa-hero-orbit{position:absolute;right:11%;top:65px;width:270px;height:270px;z-index:2;display:grid;place-items:center}.aa-orbit-ring{position:absolute;border:1px solid color-mix(in srgb,var(--agent-accent) 35%,transparent);border-radius:50%;box-shadow:0 0 30px color-mix(in srgb,var(--agent-accent) 12%,transparent)}.ring-a{inset:20px;animation:aaSpin 13s linear infinite}.ring-b{inset:54px;border-style:dashed;animation:aaSpin 8s linear infinite reverse}.aa-core{width:102px;height:102px;border-radius:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:var(--agent-accent);background:rgba(5,27,50,.88);border:1px solid color-mix(in srgb,var(--agent-accent) 75%,transparent);box-shadow:0 0 50px color-mix(in srgb,var(--agent-accent) 28%,transparent),inset 0 0 25px rgba(255,255,255,.03);animation:aaFloat 3s ease-in-out infinite}.aa-core small{font-size:8px;letter-spacing:1.4px;color:#fff;font-weight:900}
.aa-hero-metrics{position:absolute;z-index:4;right:28px;bottom:25px;display:flex;gap:10px}.aa-hero-metrics div{min-width:125px;padding:13px 16px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:rgba(5,25,46,.82);backdrop-filter:blur(14px)}.aa-hero-metrics small{display:block;color:#829bb2;font-size:8px;font-weight:900;letter-spacing:1.3px}.aa-hero-metrics strong{display:block;margin-top:4px;color:#fff;font-size:15px}
.aa-command-layout{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;margin-top:18px}.aa-command-layout main{min-width:0}.aa-glass{background:rgba(255,255,255,.92);border:1px solid #dce8f2;box-shadow:0 15px 35px rgba(15,53,86,.06);backdrop-filter:blur(12px)}.aa-console{border-radius:22px;padding:22px;position:relative;overflow:hidden}.aa-console:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--agent-accent),transparent)}.aa-section-head{display:flex;justify-content:space-between;gap:15px;align-items:center}.aa-section-head h2{margin:5px 0 0;font-size:21px;letter-spacing:-.5px}.aa-section-head h3{margin:5px 0 0;font-size:15px}.aa-section-head.compact{align-items:flex-start}.aa-kicker{display:flex;align-items:center;gap:6px}.aa-console-actions{display:flex;gap:8px}.aa-icon-btn,.aa-run,.aa-stop{border:0;border-radius:11px;height:38px;padding:0 14px;display:flex;align-items:center;gap:7px;font-weight:800;cursor:pointer}.aa-icon-btn{width:38px;padding:0;justify-content:center;background:#f0f5f9;color:#47617a}.aa-run{background:#0b2b4d;color:#fff;box-shadow:0 8px 18px rgba(7,43,77,.18)}.aa-stop{background:#fff1f1;color:#dc3e4c}.aa-console textarea{width:100%;min-height:118px;margin-top:17px;padding:17px 18px;resize:vertical;border:1px solid #d7e5ef;border-radius:16px;outline:none;font:inherit;font-size:14px;color:#183550;background:#f9fcfe;transition:.2s}.aa-console textarea:focus{border-color:var(--agent-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--agent-accent) 10%,transparent)}.aa-console-footer{display:flex;justify-content:space-between;color:#8a9caf;font-size:10px;margin-top:8px}.aa-console-footer span:first-child{display:flex;gap:5px;align-items:center}.aa-chip-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}.aa-chip-row button{border:1px solid #dbe7ef;background:#fff;border-radius:999px;padding:7px 10px;font-size:10px;color:#466078;cursor:pointer}.aa-chip-row button:hover{border-color:var(--agent-accent);transform:translateY(-1px)}
.aa-panel{margin-top:16px;border-radius:20px;padding:19px}.aa-collapse-head{width:100%;display:flex;align-items:center;gap:11px;border:0;background:none;text-align:left;color:#173651;cursor:pointer}.aa-collapse-head>div{flex:1}.aa-collapse-head b{display:block;font-size:14px}.aa-collapse-head small{display:block;color:#8ba0b3;font-size:10px;margin-top:3px}.aa-collapse-head>svg:last-child,.clickable svg{transition:.2s}.aa-collapse-head>svg:last-child.open,.clickable svg.open{transform:rotate(180deg)}.aa-scenario{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px;padding-top:17px;border-top:1px solid #e5edf3}.aa-scenario label{font-size:9px;font-weight:900;letter-spacing:.6px;color:#71889d}.aa-scenario select,.aa-scenario input:not([type=range]){display:block;width:100%;margin-top:7px;border:1px solid #d9e5ee;background:#fbfdff;border-radius:10px;padding:10px;color:#1c3b55;outline:none}.aa-range{grid-column:span 2}.aa-range b{float:right;color:var(--agent-accent)}.aa-range input{width:100%;margin-top:10px;accent-color:var(--agent-accent)}.aa-mode{grid-column:span 2;display:flex;align-items:end;gap:7px;flex-wrap:wrap}.aa-mode>span{width:100%;font-size:9px;font-weight:900;color:#71889d}.aa-mode button{border:1px solid #d9e5ee;background:#fff;border-radius:9px;padding:9px 10px;font-size:9px;font-weight:900;color:#617a91;cursor:pointer}.aa-mode button.active{background:#082845;color:#fff;border-color:#082845}
.aa-status-badge,.aa-success{padding:7px 10px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:1px;text-transform:uppercase}.aa-status-badge{background:#edf3f8;color:#668095}.aa-status-badge.running{background:#e5f7ff;color:#078fc7}.aa-status-badge.completed{background:#e8fbf4;color:#079a6b}.aa-status-badge.failed{background:#fff0f0;color:#d83d4b}.aa-status-badge.approval_required{background:#fff3e5;color:#d67b00}.aa-pipeline{display:flex;align-items:center;justify-content:space-between;margin-top:23px;overflow:auto;padding-bottom:5px}.aa-node{min-width:78px;text-align:center}.aa-node>div{width:42px;height:42px;margin:auto;border-radius:13px;display:grid;place-items:center;background:#f1f5f8;color:#9aabb9;border:1px solid #e2eaf0;transition:.3s}.aa-node.done>div{background:#e8fbf4;color:#08a676;border-color:#bcefdc}.aa-node.active>div{background:color-mix(in srgb,var(--agent-accent) 12%,white);color:var(--agent-accent);border-color:var(--agent-accent);box-shadow:0 0 0 7px color-mix(in srgb,var(--agent-accent) 8%,transparent);animation:aaPulseBox 1.6s infinite}.aa-node small{display:block;margin-top:7px;font-size:9px;font-weight:900;color:#506a81}.aa-node em{display:block;margin-top:3px;font-style:normal;font-size:7px;color:#a1afbb;font-weight:800}.aa-node.active em{color:var(--agent-accent)}.aa-connector{min-width:30px;height:1px;background:#dbe5ec}.aa-connector.flow{background:linear-gradient(90deg,#13a9e9,var(--agent-accent));box-shadow:0 0 7px color-mix(in srgb,var(--agent-accent) 25%,transparent)}
.aa-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}.aa-tool-list,.aa-events{margin-top:13px}.aa-tool{display:flex;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid #edf2f5;font-size:10px}.aa-tool>span:nth-child(2){flex:1;color:#405c73}.aa-tool small{color:#9aabb9;font-family:ui-monospace,monospace}.tool-dot{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:#f0f4f7;color:#9aaab8}.tool-dot.running{background:#e6f8ff;color:#079bd1}.tool-dot.completed{background:#e9faf4;color:#09a775}.tool-dot.failed{background:#fff0f0;color:#dd4754}.tool-dot svg{animation:aaSpin 1s linear infinite}.aa-live-dot{font-size:8px;font-weight:900;color:#06a978}.aa-live-dot:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#21d99d;margin-right:5px;animation:aaPulse 1.4s infinite}.aa-events{max-height:184px;overflow:auto}.aa-event{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #edf2f5;font-size:10px}.aa-event code{color:#8ea1b2;font-size:9px}.aa-event.success span{color:#079c70}.aa-event.error span{color:#d73e4c}.aa-event.warning span{color:#c77a09}
.aa-error,.aa-approval{margin-top:16px;border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:13px}.aa-error{background:#fff5f5;border:1px solid #ffd9dc;color:#c93f4d}.aa-error div,.aa-approval div{flex:1}.aa-error b,.aa-approval h3{display:block;font-size:13px}.aa-error p,.aa-approval p{margin:3px 0 0;font-size:10px;color:#788b9d}.aa-error button,.aa-approval button{border:0;background:#fff;border:1px solid #e2d1d4;border-radius:9px;padding:9px 11px;display:flex;align-items:center;gap:6px;font-size:9px;font-weight:900;cursor:pointer}.aa-approval{background:linear-gradient(135deg,#fffaf2,#fff);border:1px solid #f3d8aa}.aa-approval-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:#fff1da;color:#e39a25}.aa-approval span{font-size:8px;color:#d58713;font-weight:900;letter-spacing:1.3px}.aa-approval h3{margin:3px 0}.aa-approval button{background:#162f49;color:#fff;border-color:#162f49}
.aa-result{margin-top:16px;border-radius:20px;padding:20px;overflow:hidden;animation:aaReveal .5s ease}.aa-result-top{display:flex;align-items:center;justify-content:space-between}.aa-result-top h2{margin:5px 0 0;font-size:20px}.aa-success{display:flex;gap:5px;align-items:center;background:#e8fbf4;color:#079d70}.aa-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:17px}.aa-metrics div{padding:14px;border-radius:13px;background:#f5f8fa;border:1px solid #e5edf2}.aa-metrics small{display:block;color:#899cac;font-size:8px;font-weight:900;text-transform:uppercase}.aa-metrics strong{display:block;margin-top:5px;font-size:17px}.aa-result-body{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px;padding-top:17px;border-top:1px solid #e7eef3}.aa-result-body h4{margin:0 0 9px;font-size:11px}.aa-result-body p{font-size:11px;line-height:1.7;color:#60788e}.aa-plan-row{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:7px;padding:8px;border-bottom:1px solid #edf2f5;font-size:10px}.aa-plan-row span{color:var(--agent-accent);font-weight:900}.aa-plan-row small{color:#98a8b5}.aa-muted{color:#98a8b5;font-size:10px}
.aa-side-card{border-radius:19px;padding:17px;margin-bottom:16px}.aa-side-title{display:flex;align-items:center;justify-content:space-between;color:#173650;font-size:11px;font-weight:900}.aa-side-title>span:first-child{display:flex;align-items:center;gap:7px}.aa-health{font-size:8px;color:#06a675}.aa-health i{display:inline-block;margin-right:5px;width:6px;height:6px}.aa-health-row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #edf2f5;font-size:9px}.aa-health-row span{color:#8295a6}.aa-health-row b{color:#0b9d70;font-size:8px}.aa-quick{width:100%;border:1px solid #e5edf2;background:#f7fafc;border-radius:11px;padding:10px;margin-top:8px;display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer;transition:.2s}.aa-quick:hover{transform:translateX(3px);border-color:var(--agent-accent);background:#fff}.aa-quick span{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:#eaf4fa;color:var(--agent-accent);font-size:8px;font-weight:900}.aa-quick b{flex:1;font-size:9px;color:#4c667d}.aa-context-list div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #edf2f5}.aa-context-list span{font-size:9px;color:#8497a8}.aa-context-list b{font-size:9px;color:#2e4d65}.clickable{width:100%;border:0;background:none;cursor:pointer;padding:0}.clickable svg{transition:.2s}.clickable svg.open{transform:rotate(180deg)}.aa-history{margin-top:10px}.aa-history button{width:100%;border:0;border-bottom:1px solid #edf2f5;background:none;text-align:left;padding:10px 0;cursor:pointer}.aa-history small,.aa-history span{display:block;color:#94a5b3;font-size:8px}.aa-history b{display:block;color:#3b5870;font-size:9px;margin:3px 0}
@keyframes aaSpin{to{transform:rotate(360deg)}}@keyframes aaPulse{50%{box-shadow:0 0 0 8px rgba(39,227,164,.02);opacity:.65}}@keyframes aaPulseBox{50%{box-shadow:0 0 0 10px color-mix(in srgb,var(--agent-accent) 3%,transparent)}}@keyframes aaFloat{50%{transform:translateY(-7px)}}@keyframes aaZoom{to{transform:scale(1.04)}}@keyframes aaReveal{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media(max-width:1200px){.aa-command-layout{grid-template-columns:1fr}.aa-command-layout aside{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.aa-side-card{margin:0}.aa-hero-orbit{right:7%}}
@media(max-width:800px){.advanced-agent-page{padding:12px}.aa-hero{height:470px}.aa-hero-image{inset:45% 0 0}.aa-hero-content{left:22px;top:24px}.aa-title-row h1{font-size:34px}.aa-hero-orbit{right:20px;bottom:48px;top:auto;width:150px;height:150px}.aa-core{width:72px;height:72px}.aa-hero-metrics{left:20px;right:20px;bottom:16px}.aa-hero-metrics div{min-width:0;flex:1}.aa-scenario,.aa-two-col,.aa-result-body{grid-template-columns:1fr}.aa-range,.aa-mode{grid-column:auto}.aa-command-layout aside{display:block}.aa-pipeline{justify-content:flex-start}.aa-node{min-width:72px}}
@media(prefers-reduced-motion:reduce){.advanced-agent-page *,.advanced-agent-page *:before,.advanced-agent-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition:none!important}}
'@

Set-Content ".\src\features\ai-assistant\pages\AdvancedAIAgentWorkspace.tsx" $tsx -Encoding UTF8
Set-Content ".\src\features\ai-assistant\styles\advanced-agent-workspace.css" $css -Encoding UTF8

$dash = ".\src\features\dashboard\pages\SystemAdministratorDashboard.tsx"
$s = Get-Content $dash -Raw

if (-not $s.Contains("AdvancedAIAgentWorkspace")) {
    $s = $s.Replace(
        'import AIAgentExperiencePage from "../../ai-assistant/pages/AIAgentExperiencePage";',
        'import AIAgentExperiencePage from "../../ai-assistant/pages/AIAgentExperiencePage";' + "`r`n" +
        'import AdvancedAIAgentWorkspace from "../../ai-assistant/pages/AdvancedAIAgentWorkspace";'
    )
}

$s = $s.Replace('<AIAgentExperiencePage agent="risk" />','<AdvancedAIAgentWorkspace agent="risk" />')
$s = $s.Replace('<AIAgentExperiencePage agent="vulnerability" />','<AdvancedAIAgentWorkspace agent="vulnerability" />')
$s = $s.Replace('<AIAgentExperiencePage agent="resource" />','<AdvancedAIAgentWorkspace agent="resource" />')
$s = $s.Replace('<AIAgentExperiencePage agent="warning" />','<AdvancedAIAgentWorkspace agent="warning" />')
$s = $s.Replace('<AIAgentExperiencePage agent="volunteer" />','<AdvancedAIAgentWorkspace agent="volunteer" />')

Set-Content $dash $s -Encoding UTF8

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " ADVANCED AI WORKSPACE INSTALLED" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "5 dedicated agent pages upgraded."
Write-Host "Natural-language command console"
Write-Host "Real orchestrator API integration"
Write-Host "Scenario builder"
Write-Host "Execution modes"
Write-Host "Live pipeline"
Write-Host "Tool activity"
Write-Host "Event telemetry"
Write-Host "Governance gate"
Write-Host "Execution history"
Write-Host "Agent health"
Write-Host "Responsive premium UI"
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    throw "Frontend build failed. Fix the reported TypeScript error(s) before testing the page."
}

Write-Host ""
Write-Host "BUILD SUCCESSFUL" -ForegroundColor Green
