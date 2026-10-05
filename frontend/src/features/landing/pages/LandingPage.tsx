import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/layout/Navbar";

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h13" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const Icon = ({
  type,
}: {
  type: "risk" | "vulnerability" | "resource" | "warning" | "map" | "people";
}) => {
  const paths = {
    risk: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3-4 3 2 5-7" />
        <path d="M15 6h3v3" />
      </>
    ),
    vulnerability: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c.8-4.2 3.1-6.3 7-6.3s6.2 2.1 7 6.3" />
      </>
    ),
    resource: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </>
    ),
    warning: (
      <>
        <path d="M12 4 21 19H3L12 4Z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </>
    ),
    map: (
      <>
        <path d="M4 6.5 9 4l6 3 5-2.5v13L15 20l-6-3-5 2.5v-13Z" />
        <path d="M9 4v13M15 7v13" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.7-3.6 2.5-5.4 5.5-5.4s4.8 1.8 5.5 5.4" />
        <path d="M16 6.5a2.7 2.7 0 1 1 0 5.4" />
        <path d="M16 14c2.3.2 3.8 2 4.5 5" />
      </>
    ),
  };

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  );
};

const solutions = [
  {
    title: "Risk Prediction",
    subtitle: "Agent 01  Risk intelligence",
    description:
      "Detect and score supported disaster hazards using AI-assisted analysis and real-time environmental signals.",
    detail: "Combines hazard signals, environmental conditions and risk factors into one operational prediction.",
    tags: ["Multi-hazard", "Live signals", "Risk score"],
    icon: "risk" as const,
    tone: "blue",
  },
  {
    title: "Vulnerability & Impact",
    subtitle: "Agent 02  Community exposure",
    description:
      "Assess exposed populations, vulnerability and likely impact so response teams can understand where support is needed.",
    detail: "Turns population exposure and vulnerability information into a clearer picture of expected community impact.",
    tags: ["Exposure", "Vulnerability", "Impact"],
    icon: "vulnerability" as const,
    tone: "violet",
  },
  {
    title: "Resource Optimization",
    subtitle: "Agent 03  Relief capacity",
    description:
      "Connect relief inventory with operational needs and support smarter resource allocation during emergencies.",
    detail: "Helps response teams understand available capacity and align relief resources with changing needs.",
    tags: ["Inventory", "Allocation", "Capacity"],
    icon: "resource" as const,
    tone: "emerald",
  },
  {
    title: "Early Warning & Coordination",
    subtitle: "Agent 04  Warning operations",
    description:
      "Turn risk intelligence into actionable alerts and coordinated response workflows for faster decisions.",
    detail: "Connects warning information with coordinated operational workflows so important actions are easier to organize.",
    tags: ["Alerts", "Coordination", "Response"],
    icon: "warning" as const,
    tone: "rose",
  },
];

const impactItems = [
  {
    title: "Earlier decisions",
    text: "Move from reactive response toward risk-informed preparedness.",
    icon: "risk" as const,
  },
  {
    title: "Safer communities",
    text: "Give affected people clearer access to warnings and assistance.",
    icon: "people" as const,
  },
  {
    title: "Smarter resources",
    text: "Coordinate relief capacity around changing operational needs.",
    icon: "resource" as const,
  },
  {
    title: "Connected response",
    text: "Bring prediction, assessment, resources and warnings together.",
    icon: "map" as const,
  },
];

const LandingPage = () => {
  const [activeSolution, setActiveSolution] = useState(0);
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(".rn-reveal")
      );

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("rn-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );

      elements.forEach((element) => observer.observe(element));

      (window as Window & { __rnRevealObserver?: IntersectionObserver }).__rnRevealObserver = observer;
    }, 40);

    return () => {
      window.clearTimeout(timer);
      const win = window as Window & { __rnRevealObserver?: IntersectionObserver };
      win.__rnRevealObserver?.disconnect();
      delete win.__rnRevealObserver;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSolution((current) => (current + 1) % solutions.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const addReveal = (element: HTMLElement | null) => {
    if (element && !revealRefs.current.includes(element)) {
      revealRefs.current.push(element);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f8fc] text-[#07182f]">
      <div className="rn-landing-real-photo" style={{ backgroundImage: `url("https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg/1024px-Woman_in_Sri_Lanka_rescued_during_monsoon_flooding.jpg")` }} aria-hidden="true" />
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes rnFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -16px, 0); }
        }

        @keyframes rnHeroZoom {
          0%, 100% { transform: scale(1.03); }
          50% { transform: scale(1.085); }
        }

        @keyframes rnHeroDrift {
          0%, 100% { transform: translate3d(-1%, 0, 0) scale(1.04); }
          50% { transform: translate3d(1%, -0.7%, 0) scale(1.07); }
        }

        @keyframes rnShimmer {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(230%) skewX(-18deg); }
        }

        @keyframes rnScan {
          0% { transform: translateY(-120%); opacity: 0; }
          12% { opacity: .9; }
          55% { opacity: .55; }
          100% { transform: translateY(520%); opacity: 0; }
        }

        @keyframes rnOrbit {
          from { transform: rotate(0deg) translateX(95px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(95px) rotate(-360deg); }
        }

        @keyframes rnGlowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, .08), 0 0 28px rgba(37, 149, 255, .12); }
          50% { box-shadow: 0 0 0 14px rgba(45, 212, 191, 0), 0 0 55px rgba(37, 149, 255, .25); }
        }

        @keyframes rnWave {
          0%, 100% { transform: translateX(-3%) scaleX(1); }
          50% { transform: translateX(3%) scaleX(1.035); }
        }

        @keyframes rnParticle {
          0% { transform: translateY(20px) scale(.7); opacity: 0; }
          20% { opacity: .85; }
          80% { opacity: .65; }
          100% { transform: translateY(-110px) scale(1.15); opacity: 0; }
        }

        @keyframes rnFloatSlow {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -18px, 0) rotate(1deg); }
        }

        @keyframes rnPulse {
          0%, 100% { opacity: .35; transform: scale(.92); }
          50% { opacity: .95; transform: scale(1.08); }
        }

        @keyframes rnScan {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(210%); }
        }

        @keyframes rnShimmer {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(130%); }
        }

        @keyframes rnGrid {
          0% { transform: translateY(0); }
          100% { transform: translateY(42px); }
        }

        @keyframes rnBlink {
          0%, 100% { opacity: .45; }
          50% { opacity: 1; }
        }

        .rn-float { animation: rnFloat 5.5s ease-in-out infinite; }
        .rn-float-slow { animation: rnFloatSlow 7s ease-in-out infinite; }
        .rn-pulse { animation: rnPulse 2.4s ease-in-out infinite; }
        .rn-blink { animation: rnBlink 1.8s ease-in-out infinite; }
        .rn-hero-photo { animation: rnHeroDrift 14s ease-in-out infinite; transform-origin: center; }
        .rn-shimmer { animation: rnShimmer 4.8s ease-in-out infinite; }
        .rn-scan { animation: rnScan 6s ease-in-out infinite; }
        .rn-orbit { animation: rnOrbit 10s linear infinite; }
        .rn-glow-pulse { animation: rnGlowPulse 3.2s ease-in-out infinite; }
        .rn-wave { animation: rnWave 7s ease-in-out infinite; }
        .rn-particle { animation: rnParticle 5s ease-in-out infinite; }

        .rn-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1);
        }

        .rn-reveal.rn-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .rn-delay-1 { transition-delay: .08s; }
        .rn-delay-2 { transition-delay: .16s; }
        .rn-delay-3 { transition-delay: .24s; }
        .rn-delay-4 { transition-delay: .32s; }

        .rn-glow {
          box-shadow:
            0 25px 70px rgba(5, 28, 55, .16),
            inset 0 1px 0 rgba(255,255,255,.12);
        }

        .rn-noise {
          background-image:
            radial-gradient(circle at 15% 15%, rgba(91, 220, 255, .11) 0 1px, transparent 1px),
            radial-gradient(circle at 70% 30%, rgba(255,255,255,.08) 0 1px, transparent 1px);
          background-size: 36px 36px, 58px 58px;
        }

        .rn-map-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
          background-size: 42px 42px;
          animation: rnGrid 8s linear infinite;
        }

        .rn-card-lift {
          transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
        }

        .rn-card-lift:hover {
          transform: translateY(-7px);
          box-shadow: 0 25px 55px rgba(15, 50, 90, .13);
        }

        .rn-button {
          transition: transform .25s ease, box-shadow .25s ease, background-color .25s ease;
        }

        .rn-button:hover {
          transform: translateY(-2px);
        }

        .rn-sky-grid {
          background-image:
            linear-gradient(rgba(14, 116, 144, .045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 116, 144, .045) 1px, transparent 1px);
          background-size: 42px 42px;
        }

        .rn-sky-orb {
          background: radial-gradient(circle, rgba(56, 189, 248, .22), rgba(125, 211, 252, .08) 42%, transparent 72%);
          filter: blur(2px);
        }

        .rn-sky-card {
          border: 1px solid rgba(125, 211, 252, .34);
          background: rgba(255, 255, 255, .82);
          box-shadow: 0 18px 55px rgba(14, 116, 144, .08);
          backdrop-filter: blur(14px);
        }

        .rn-sky-card:hover {
          border-color: rgba(14, 165, 233, .48);
          box-shadow: 0 24px 65px rgba(14, 116, 144, .14);
        }

        .rn-sky-section {
          background:
            radial-gradient(circle at 8% 15%, rgba(125, 211, 252, .24), transparent 27%),
            radial-gradient(circle at 92% 70%, rgba(186, 230, 253, .42), transparent 30%),
            linear-gradient(180deg, #f8fdff 0%, #eefaff 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .rn-reveal { opacity: 1 !important; transform: none !important; }

          *, *::before, *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .001ms !important;
          }
        }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section id="home" className="relative min-h-[900px] overflow-hidden bg-[#031827]">
        <div className="absolute inset-0">
          <img
            src="/images/reliefnexus-hero-cinematic.png"
            alt="ReliefNexus disaster response scene"
            className="rn-hero-photo h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,16,30,.94)_0%,rgba(3,23,42,.76)_37%,rgba(3,23,42,.30)_67%,rgba(3,23,42,.35)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,13,25,.84)_0%,transparent_45%,rgba(1,14,26,.25)_100%)]" />
          <div className="rn-noise absolute inset-0 opacity-50" />
          <div className="rn-scan pointer-events-none absolute left-[38%] top-0 h-1/3 w-24 bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent blur-xl" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="rn-particle absolute left-[48%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span className="rn-particle absolute left-[61%] bottom-[11%] h-1 w-1 rounded-full bg-blue-300" style={{ animationDelay: "1.4s" }} />
            <span className="rn-particle absolute left-[73%] bottom-[22%] h-1.5 w-1.5 rounded-full bg-emerald-300" style={{ animationDelay: "2.3s" }} />
          </div>
        </div>

        <div className="absolute left-[7%] top-[28%] h-2 w-2 rounded-full bg-cyan-300 rn-pulse shadow-[0_0_30px_8px_rgba(34,211,238,.35)]" />
        <div className="absolute right-[31%] top-[32%] h-2 w-2 rounded-full bg-emerald-300 rn-pulse shadow-[0_0_30px_8px_rgba(52,211,153,.35)]" />
        <div className="absolute right-[13%] top-[49%] h-2 w-2 rounded-full bg-blue-300 rn-pulse shadow-[0_0_30px_8px_rgba(96,165,250,.35)]" />

        <div className="relative z-10 mx-auto flex min-h-[900px] max-w-[1440px] items-center px-5 pb-24 pt-32 sm:px-8 lg:px-12">
          <div className="max-w-[670px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-200 backdrop-blur-md rn-reveal">
              <span className="h-2 w-2 rounded-full bg-cyan-300 rn-blink" />
              Smarter disaster management
            </div>

            <h1 className="rn-reveal rn-delay-1 text-5xl font-black leading-[.94] tracking-[-.055em] text-white sm:text-6xl lg:text-[86px]">
              Stronger
              <br />
              Communities,
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-white bg-clip-text text-transparent">
                Safer Tomorrows.
              </span>
            </h1>

            <p className="rn-reveal rn-delay-2 mt-7 max-w-[590px] text-base leading-7 text-slate-200 sm:text-lg">
              ReliefNexus brings risk prediction, vulnerability assessment,
              resource optimization and early warning into one connected
              disaster-response platform.
            </p>

            <div className="rn-reveal rn-delay-3 mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rn-button group flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-4 text-sm font-extrabold text-white shadow-[0_15px_45px_rgba(37,120,255,.35)]"
              >
                Get Started
                <Arrow className="transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={() =>
                  document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" })
                }
                className="rn-button flex items-center gap-3 rounded-full border border-white/30 bg-white/8 px-7 py-4 text-sm font-bold text-white backdrop-blur-md hover:bg-white/15"
              >
                Explore Platform
                <Arrow />
              </button>
            </div>

            <div className="rn-reveal rn-delay-4 mt-10 flex flex-wrap gap-6 text-xs text-slate-200">
              {["AI-assisted intelligence", "Real-time alerts", "Connected response"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* HERO FLOATING INTELLIGENCE CARDS */}
          <div className="pointer-events-none absolute right-[5%] top-[25%] hidden w-[410px] lg:block">
            <div className="rn-float-slow rounded-[28px] border border-white/20 bg-[#071d31]/65 p-4 shadow-[0_30px_90px_rgba(0,0,0,.3)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-cyan-600">
                    Live response intelligence
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Operational overview</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9px] font-bold text-emerald-300">
                  LIVE
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["Risk Prediction", "Multi-hazard assessment", "72%"],
                  ["Vulnerability & Impact", "Community exposure", "ACTIVE"],
                  ["Early Warning", "Alert coordination", "READY"],
                ].map(([title, text, value], index) => (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.06] p-3"
                    style={{ animationDelay: `${index * 160}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200">
                        <span className="h-2 w-2 rounded-full bg-cyan-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{title}</p>
                        <p className="mt-0.5 text-[9px] text-slate-300">{text}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-cyan-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* HERO METRICS */}
        <div className="absolute bottom-0 left-1/2 z-20 w-[calc(100%-40px)] max-w-[1220px] -translate-x-1/2 translate-y-1/2">
          <div className="relative grid grid-cols-2 overflow-hidden rounded-[26px] border border-white/15 bg-[#071d31]/90 shadow-[0_25px_80px_rgba(18,53,90,.10)] backdrop-blur-2xl sm:grid-cols-4">
            {[
              ["4", "AI response agents"],
              ["24/7", "Operational readiness"],
              ["Real-time", "Risk intelligence"],
              ["Connected", "Response workflow"],
            ].map(([value, label], index) => (
              <div
                key={label}
                className={`px-5 py-5 sm:px-7 sm:py-6 ${index > 0 ? "border-l border-white/10" : ""} ${index > 1 ? "border-t sm:border-t-0" : ""}`}
              >
                <p className="text-2xl font-black tracking-tight text-white">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section id="solutions" className="relative overflow-hidden rn-sky-section px-5 pb-18 pt-24 text-[#07182f] sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-24 top-8 h-80 w-80 rounded-full rn-sky-orb" />
        <div className="mx-auto max-w-[1320px]">
          <div ref={addReveal} className="rn-reveal max-w-2xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-600">
              One connected platform
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#07182f] sm:text-5xl">
              From risk intelligence
              <br />
              to coordinated action.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Four specialized response agents work across the same operational
              ecosystem so teams can move from prediction to action without
              disconnected workflows.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Predict", "Identify changing hazard signals before they become disconnected decisions."],
              ["Assess", "Understand exposure, vulnerability and likely impact across affected communities."],
              ["Coordinate", "Align resources, warnings and response workflows around one shared picture."],
            ].map(([title, text], index) => (
              <div
                key={title}
                ref={addReveal}
                className={`rn-reveal rn-delay-${index + 1} rn-sky-card rounded-[20px] p-4`}
              >
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div ref={addReveal} className="rn-reveal rounded-[28px] rn-sky-card border border-sky-100 bg-white/85 p-2 shadow-[0_25px_80px_rgba(18,53,90,.10)]">
              <div className="relative min-h-[500px] overflow-hidden rounded-[24px] bg-[#071d31]">
                <img
                  src="/images/reliefnexus-hero-cinematic.png"
                  alt="Disaster response operations"
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-65"
                />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,22,39,.92),rgba(5,31,53,.42),rgba(3,17,29,.82))]" />
                <div className="rn-map-grid absolute inset-0 opacity-25" />

                <div className="relative flex min-h-[500px] flex-col justify-between p-7 sm:p-9">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-600">
                        Situational awareness
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-[#07182f]">Live response picture</h3>
                    </div>
                    <span className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-bold text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="relative">
                    {[
                      ["Flood risk", "HIGH", "left-[13%] top-[12%]", "bg-orange-400"],
                      ["Drought", "CRITICAL", "right-[12%] top-[2%]", "bg-red-400"],
                      ["Response team", "ACTIVE", "left-[39%] bottom-[7%]", "bg-emerald-400"],
                    ].map(([title, level, position, dot], index) => (
                      <div
                        key={title}
                        className={`absolute ${position} rn-float rounded-2xl border border-white/15 bg-[#071d31]/80 px-4 py-3 shadow-xl backdrop-blur-md`}
                        style={{ animationDelay: `${index * 900}ms` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dot}`} />
                          <p className="text-[10px] font-bold text-white">{title}</p>
                        </div>
                        <p className="mt-1 text-[9px] font-semibold text-slate-500">{level}</p>
                      </div>
                    ))}

                    <div className="mx-auto flex h-48 max-w-[520px] items-center justify-center rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.04]">
                      <div className="relative h-36 w-36 rounded-full border border-cyan-300/20">
                        <div className="absolute inset-5 rounded-full border border-cyan-300/25" />
                        <div className="absolute inset-12 rounded-full bg-cyan-300/20 rn-pulse" />
                        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_30px_10px_rgba(103,232,249,.4)]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-700">
                      Risk intelligence
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-700">
                      Population exposure
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-slate-700">
                      Resource readiness
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {solutions.map((solution, index) => {
                const active = activeSolution === index;

                const tone =
                  solution.tone === "blue"
                    ? "text-blue-600 bg-blue-50 border-blue-100"
                    : solution.tone === "violet"
                      ? "text-violet-600 bg-violet-50 border-violet-100"
                      : solution.tone === "emerald"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                        : "text-rose-600 bg-rose-50 border-rose-100";

                return (
                  <button
                    key={solution.title}
                    type="button"
                    onClick={() => setActiveSolution(index)}
                    className={`rn-card-lift w-full rounded-[22px] border p-4 text-left ${
                      active
                        ? "border-cyan-200 bg-cyan-50 shadow-[0_18px_55px_rgba(18,53,90,.10)]"
                        : "border-slate-200 bg-white/95 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${tone}`}>
                        <Icon type={solution.icon} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#07182f]">{solution.title}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">
                              {solution.subtitle}
                            </p>
                          </div>

                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${active ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-600" : "border-slate-200 text-slate-500"}`}>
                            <Arrow className={active ? "translate-x-0.5" : ""} />
                          </div>
                        </div>

                        <div className={`grid transition-all duration-500 ${active ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <p className="max-w-xl text-sm leading-6 text-slate-600">{solution.description}</p>
                            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">{solution.detail}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {solution.tags.map((tag: string) => (
                                <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-cyan-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-white px-5 py-18 text-[#07182f] sm:px-8 lg:px-12">
        <div className="absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-[1320px]">
          <div ref={addReveal} className="rn-reveal mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-700">
              How ReliefNexus works
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#07182f] sm:text-5xl">
              One connected flow from
              <br />
              <span className="text-cyan-600">signal to response.</span>
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Each AI agent contributes a focused layer of intelligence while the platform
              keeps the overall response picture connected for decision-makers and field teams.
            </p>
          </div>

          <div className="relative mt-9 grid gap-3 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-cyan-200 via-blue-300 to-emerald-200 md:block" />
            {[
              {
                no: "01",
                title: "Detect",
                text: "Analyse environmental and incident signals to identify emerging hazards and risk levels.",
                icon: "risk" as const,
              },
              {
                no: "02",
                title: "Assess",
                text: "Understand who and what is exposed, including community vulnerability and likely impact.",
                icon: "vulnerability" as const,
              },
              {
                no: "03",
                title: "Prepare",
                text: "Connect available relief capacity with operational needs and changing response priorities.",
                icon: "resource" as const,
              },
              {
                no: "04",
                title: "Coordinate",
                text: "Turn intelligence into warnings, decisions and coordinated actions across the response cycle.",
                icon: "warning" as const,
              },
            ].map((step, index) => (
              <div
                key={step.no}
                ref={addReveal}
                className={`rn-reveal rn-delay-${index + 1} relative rounded-[24px] rn-sky-card border border-sky-100 bg-white/85 p-5 shadow-[0_18px_55px_rgba(18,53,90,.07)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_25px_65px_rgba(18,53,90,.12)]`}
              >
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
                  <Icon type={step.icon} />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <h3 className="text-lg font-black">{step.title}</h3>
                  <span className="text-[10px] font-black tracking-[.16em] text-slate-400">{step.no}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" className="relative overflow-hidden bg-[#eef8fd] px-5 py-20 text-[#07182f] sm:px-8 lg:px-12">
        <div className="absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute inset-0 opacity-30" />
        </div>

        <div className="relative mx-auto max-w-[1320px]">
          <div ref={addReveal} className="rn-reveal flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-600">
                Our impact
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">
                Technology that supports
                <br />
                <span className="text-cyan-600">human response.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              ReliefNexus is designed around one goal: making critical
              information easier to understand and turning it into coordinated
              action when communities need it most.
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {impactItems.map((item, index) => (
              <div
                key={item.title}
                ref={addReveal}
                className={`rn-reveal rn-delay-${index + 1} rn-card-lift rounded-[22px] border border-white/10 bg-white p-5 backdrop-blur-md`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-600">
                  <Icon type={item.icon} />
                </div>
                <h3 className="mt-6 text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "See earlier", "Move from scattered signals to a clearer operational picture before decisions become urgent."],
              ["02", "Understand exposure", "Bring vulnerability, affected communities and impact information into the same workflow."],
              ["03", "Coordinate action", "Connect resources, warnings and response teams around the information that matters."],
            ].map(([step, title, text]) => (
              <div key={step} ref={addReveal} className="rn-reveal rounded-2xl rn-sky-card border border-sky-100 bg-white/85/85 p-5 shadow-[0_15px_45px_rgba(18,53,90,.06)]">
                <span className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">{step}</span>
                <h3 className="mt-2 text-base font-black text-[#07182f]">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="rn-sky-section px-5 py-20 text-[#07182f] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div ref={addReveal} className="rn-reveal relative">
            <div className="overflow-hidden rounded-[30px] rn-sky-card border border-sky-100 bg-white/85 p-2 shadow-[0_25px_80px_rgba(0,0,0,.30)]">
              <div className="relative overflow-hidden rounded-[26px]">
                <img
                  src="/images/reliefnexus-hero-cinematic.png"
                  alt="Emergency response coordination"
                  className="h-[470px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#031523]/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-[#eaf8ff]/75 p-5 backdrop-blur-xl">
                  <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-cyan-600">
                    Built for resilience
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    One operational picture. Four connected response agents.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div ref={addReveal} className="rn-reveal">
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-600">
              About ReliefNexus
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#07182f] sm:text-5xl">
              Built to connect the
              <br />
              whole response cycle.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Disaster management depends on many teams, many signals and
              decisions that change quickly. ReliefNexus brings those pieces
              together into a single platform designed for visibility,
              coordination and faster response.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Multi-hazard risk intelligence",
                "Community vulnerability assessment",
                "Relief resource coordination",
                "Emergency warning workflows",
                "Role-based operational dashboards",
                "Connected incident traceability",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check />
                  </span>
                  <span className="text-xs font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rn-button inline-flex items-center gap-3 rounded-full bg-[#0b65f3] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(11,101,243,.22)]"
              >
                Create an account
                <Arrow />
              </Link>
              <Link
                to="/login"
                className="rn-button inline-flex items-center gap-3 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-[#07182f] backdrop-blur-md"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* IN ACTION */}
      <section className="bg-[#f4f9fd] px-5 py-20 text-[#07182f] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1320px]">
          <div ref={addReveal} className="rn-reveal flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-cyan-600">
                In action
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#07182f] sm:text-5xl">
                Real response.
                <br />
                <span className="text-cyan-600">Real people.</span>
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                From the first warning to field coordination and relief distribution,
                ReliefNexus connects the information that response teams need.
              </p>
            </div>
            <div className="rounded-full rn-sky-card border border-sky-100 bg-white/85 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-600 shadow-sm">
              Response ecosystem
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <div ref={addReveal} className="rn-reveal rn-card-lift group relative min-h-[510px] overflow-hidden rounded-[32px] bg-[#071d31]">
              <img
                src="/images/reliefnexus-response-collage.png"
                alt="Emergency rescue and relief response"
                className="absolute inset-0 h-full w-full object-cover object-[0%_0%] transition duration-[1200ms] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#031523]/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#eaf8ff]/70 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-cyan-200 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Emergency response
                </div>
                <h3 className="mt-3 text-3xl font-black text-white">Coordinate action when every minute matters.</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
                  Risk intelligence, field teams and relief capacity can work from the same operational picture.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  title: "Command intelligence",
                  text: "Monitor incidents and evolving hazards from one connected view.",
                  pos: "50% 0%",
                  color: "cyan",
                },
                {
                  title: "Relief distribution",
                  text: "Keep critical supplies aligned with community needs.",
                  pos: "0% 100%",
                  color: "emerald",
                },
                {
                  title: "Community support",
                  text: "Keep affected people connected to warnings and assistance.",
                  pos: "100% 100%",
                  color: "blue",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  ref={addReveal}
                  className={`rn-reveal rn-delay-${index + 1} rn-card-lift group relative min-h-[150px] overflow-hidden rounded-[26px] rn-sky-card border border-sky-100 bg-white/85`}
                >
                  <img
                    src="/images/reliefnexus-response-collage.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-110"
                    style={{ objectPosition: item.pos }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#061a2b]/95 via-[#061a2b]/70 to-[#061a2b]/20" />
                  <div className="relative p-6">
                    <div className={`h-2 w-2 rounded-full ${item.color === "emerald" ? "bg-emerald-400" : item.color === "blue" ? "bg-blue-400" : "bg-cyan-300"} rn-pulse`} />
                    <h3 className="mt-3 text-lg font-black text-white">{item.title}</h3>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-slate-200">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section id="contact" className="bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div ref={addReveal} className="rn-reveal mx-auto max-w-[1180px]">
          <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#061a2b] via-[#083456] to-[#0b65f3] px-7 py-14 sm:px-12 lg:px-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-9 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-cyan-700">
                  Ready when it matters
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#07182f] sm:text-5xl">
                  Build a stronger,
                  <br />
                  more prepared community.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
                  Start with ReliefNexus and bring risk intelligence,
                  vulnerability assessment, resources and warnings into one
                  connected response environment.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rn-button inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-extrabold text-[#0757c9] shadow-xl"
                >
                  Get Started
                  <Arrow />
                </Link>
                <Link
                  to="/login"
                  className="rn-button inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-extrabold text-[#07182f] backdrop-blur-md"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rn-wave h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

      <footer className="border-t border-slate-200 bg-white px-5 py-9 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-black tracking-tight text-[#07182f]">
              Relief<span className="text-blue-600">Nexus</span>
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
              Disaster Management Platform
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
            <button type="button" onClick={() => document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" })}>Solutions</button>
            <button type="button" onClick={() => document.getElementById("impact")?.scrollIntoView({ behavior: "smooth" })}>Impact</button>
            <button type="button" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>About</button>
            <button type="button" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>Contact</button>
          </div>

          <p className="text-[10px] font-medium text-slate-500">
             {new Date().getFullYear()} ReliefNexus. Built for safer communities.
          </p>
        </div>
      </footer>
    </div>
  );
};


/* Light premium surface refinements */

export default LandingPage;



