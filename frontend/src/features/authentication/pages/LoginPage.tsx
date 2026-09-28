import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(email.trim(), password);

      if (user.role === "SystemAdministrator") {
        navigate("/dashboard/system-administrator");
      } else if (
        user.role === "ReliefCoordinator" ||
        user.role === "FieldVolunteer" ||
        user.role === "AffectedUser"
      ) {
        navigate("/dashboard/user");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login failed:", err);

      setError(
        err?.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes rnFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes rnPulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }

        @keyframes rnShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }

        @keyframes rnSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rnGlow {
          0%, 100% { box-shadow: 0 18px 50px rgba(14,165,233,.12); }
          50% { box-shadow: 0 22px 65px rgba(14,165,233,.24); }
        }

        .rn-login-card {
          animation: rnGlow 5s ease-in-out infinite;
        }

        .rn-float {
          animation: rnFloat 5s ease-in-out infinite;
        }

        .rn-float-delay {
          animation: rnFloat 6s ease-in-out 1s infinite;
        }

        .rn-pulse {
          animation: rnPulse 2.5s ease-in-out infinite;
        }

        .rn-shimmer {
          position: absolute;
          inset: 0;
          width: 45%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.15),
            transparent
          );
          transform: translateX(-120%);
          animation: rnShimmer 7s ease-in-out infinite;
          pointer-events: none;
        }

        .rn-orbit {
          animation: rnSpin 24s linear infinite;
          transform-origin: center;
        }

        .rn-scroll-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .rn-scroll-hidden::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .rn-input {
          transition: border-color .2s ease, box-shadow .2s ease,
            background .2s ease, transform .2s ease;
        }

        .rn-input:focus-within {
          border-color: #38bdf8;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(14,165,233,.09);
          transform: translateY(-1px);
        }

        .rn-social {
          transition: transform .2s ease, border-color .2s ease,
            box-shadow .2s ease, background .2s ease;
        }

        .rn-social:hover {
          transform: translateY(-2px);
          border-color: #bae6fd;
          background: #f8fdff;
          box-shadow: 0 10px 25px rgba(14,165,233,.08);
        }

        .rn-submit {
          transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
        }

        .rn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.04);
          box-shadow: 0 18px 35px rgba(2,132,199,.27);
        }

        .rn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .rn-feature {
          transition: transform .25s ease, background .25s ease,
            border-color .25s ease;
        }

        .rn-feature:hover {
          transform: translateY(-4px);
          background: rgba(8,47,73,.68);
          border-color: rgba(125,211,252,.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .rn-login-card,
          .rn-float,
          .rn-float-delay,
          .rn-pulse,
          .rn-shimmer,
          .rn-orbit {
            animation: none !important;
          }
        }
      `}</style>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_8%_12%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_92%_88%,rgba(14,165,233,.10),transparent_30%),#effbff] px-3 py-3 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/25 blur-3xl" />
        <div className="relative z-10 rn-login-card mx-auto flex h-[calc(100vh-28px)] max-h-[820px] min-h-[720px] w-full max-w-[1480px] overflow-hidden rounded-[30px] border border-sky-100 bg-white">

          {/* LEFT — AUTHENTICATION */}
          <section className="rn-scroll-hidden relative flex min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden bg-white lg:w-1/2">

            <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />
            <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
              <Link to="/" className="group flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
                  <LogoIcon />
                </span>

                <span className="leading-none">
                  <span className="block text-[16px] font-extrabold tracking-[-.5px] text-[#062f4d]">
                    Relief<span className="text-sky-500">Nexus</span>
                  </span>
                  <span className="mt-1 block text-[7px] font-bold uppercase tracking-[.22em] text-slate-400">
                    Disaster Management Platform
                  </span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 sm:flex"
              >
                <span>←</span>
                Back to Home
              </button>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-6 sm:px-8 sm:py-7 lg:px-10 xl:px-[8%]">
              <div className="mx-auto flex w-full max-w-[540px] flex-col justify-center">

                <div className="mb-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="h-px w-11 bg-gradient-to-r from-blue-600 to-cyan-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[.25em] text-sky-600">
                      Welcome back
                    </span>
                  </div>

                  <h1 className="max-w-[620px] text-[48px] font-black leading-[.98] tracking-[-2.5px] text-[#062f4d] sm:text-[56px] lg:text-[60px]">
                    Sign in to
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                      your workspace.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-slate-500">
                    Securely access your ReliefNexus disaster response workspace
                    and continue coordinating smarter, faster action.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <span className="mt-0.5">
                      <AlertIcon />
                    </span>
                    <p className="leading-5">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                  <div>
                    <label className="mb-2.5 block text-[11px] font-bold text-[#163b56]">
                      Email address
                    </label>

                    <div className="rn-input flex min-h-[58px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                      <div className="flex w-16 shrink-0 items-center justify-center text-slate-400">
                        <MailIcon />
                      </div>

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        className="min-w-0 flex-1 bg-transparent pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#163b56]">
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setError("Password recovery is not available yet.")
                        }
                        className="text-[11px] font-bold text-sky-600 transition hover:text-blue-700"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="rn-input flex min-h-[58px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                      <div className="flex w-16 shrink-0 items-center justify-center text-slate-400">
                        <LockIcon />
                      </div>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="px-5 text-[11px] font-bold text-sky-600 transition hover:bg-sky-50"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs font-medium text-slate-500">
                        Remember me
                      </span>
                    </label>

                    <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                      Secure access to your response workspace
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rn-submit flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(14,165,233,.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-semibold text-slate-400">
                    Or continue with
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rn-social flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600"
                  >
                    <GoogleIcon />
                    Google
                  </button>

                  <button
                    type="button"
                    className="rn-social flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600"
                  >
                    <MicrosoftIcon />
                    Microsoft
                  </button>
                </div>

                <p className="mt-5 pb-2 text-center text-xs text-slate-400">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-extrabold text-sky-600 transition hover:text-blue-700"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT — DISASTER RESILIENCE VISUAL */}
          <section className="relative hidden min-h-0 overflow-hidden bg-[#06243a] lg:block lg:w-1/2">

            <img
              src="/images/reliefnexus-hero-cinematic.png"
              alt="ReliefNexus disaster response"
              className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,50,.08)_0%,rgba(3,31,50,.28)_35%,rgba(2,18,32,.92)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(56,189,248,.22),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,.18),transparent_35%)]" />

            <div className="rn-shimmer" />

            <div className="rn-orbit absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full border border-white/10" />
            <div className="absolute -left-20 -top-20 h-[420px] w-[420px] rounded-full border border-cyan-300/10" />

            <div className="absolute left-7 right-7 top-7 flex items-center justify-between sm:left-9 sm:right-9">
              <div className="flex items-center gap-2.5 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
                  <LogoIcon />
                </div>
                <div>
                  <p className="text-sm font-extrabold">ReliefNexus</p>
                  <p className="text-[7px] font-bold uppercase tracking-[.2em] text-slate-300">
                    Disaster Intelligence
                  </p>
                </div>
              </div>

              <div className="rn-float hidden items-center gap-2 rounded-full border border-white/15 bg-slate-950/35 px-3.5 py-2 text-[9px] font-bold text-white backdrop-blur-xl sm:flex">
                <span className="rn-pulse h-2 w-2 rounded-full bg-emerald-400" />
                Live response intelligence
              </div>
            </div>

            <div className="rn-float absolute right-8 top-[17%] hidden w-[205px] rounded-2xl border border-white/15 bg-slate-950/35 p-4 backdrop-blur-xl xl:block">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-cyan-300">
                  Operational overview
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[7px] font-bold text-emerald-300">
                  LIVE
                </span>
              </div>

              <div className="space-y-2">
                <StatusRow label="Risk Prediction" value="72%" />
                <StatusRow label="Vulnerability & Impact" value="ACTIVE" />
                <StatusRow label="Early Warning" value="READY" />
              </div>
            </div>

            <div className="absolute bottom-6 left-7 right-7 sm:left-8 sm:right-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-cyan-300" />
                <span className="text-[9px] font-extrabold uppercase tracking-[.25em] text-cyan-200">
                  Disaster resilience
                </span>
              </div>

              <h2 className="max-w-[600px] text-[48px] font-black leading-[.94] tracking-[-2px] text-white xl:text-[55px]">
                Stronger
                <br />
                Communities.
                <br />
                Through
                <br />
                <span className="text-cyan-300">
                  Smarter Solutions.
                </span>
              </h2>

              <div className="mt-5 max-w-[500px] border-l-2 border-cyan-300 pl-4">
                <p className="text-sm font-semibold leading-5 text-white">
                  “Prepared today.
                  <br />
                  Safer tomorrow.”
                </p>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-2.5">
                <FeatureCard icon={<ShieldIcon />} title="Protect" text="Communities" />
                <FeatureCard icon={<PeopleIcon />} title="Coordinate" text="Resources" />
                <FeatureCard icon={<ChartIcon />} title="Save" text="More Lives" />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="h-1 w-12 rounded-full bg-cyan-300" />
                <span className="h-1 w-7 rounded-full bg-white/25" />
                <span className="h-1 w-7 rounded-full bg-white/25" />
                <span className="ml-auto text-[9px] font-semibold text-slate-300">
                  AI-powered disaster intelligence
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

const StatusRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
    <div className="flex min-w-0 items-center gap-2">
      <span className="rn-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
      <span className="truncate text-[9px] font-semibold text-slate-200">
        {label}
      </span>
    </div>
    <span className="ml-2 text-[8px] font-extrabold text-cyan-200">
      {value}
    </span>
  </div>
);

const FeatureCard = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) => (
  <div className="rn-feature rounded-2xl border border-white/10 bg-slate-950/35 p-3 backdrop-blur-xl">
    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
      {icon}
    </div>
    <p className="text-[10px] font-extrabold text-white">{title}</p>
    <p className="mt-0.5 text-[9px] text-slate-300">{text}</p>
  </div>
);

const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 20V10" />
    <path d="M10 20V6" />
    <path d="M15 20V3" />
    <path d="M20 20V8" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.3 3.3 2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.22Z" />
    <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.5A9.75 9.75 0 0 0 12 21.75Z" />
    <path fill="#FBBC05" d="M6.54 13.85a5.86 5.86 0 0 1 0-3.7v-2.5H3.29a9.75 9.75 0 0 0 0 8.7l3.25-2.5Z" />
    <path fill="#EA4335" d="M12 6.12c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.4l3.25 2.5C7.31 7.84 9.46 6.12 12 6.12Z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <rect x="3" y="3" width="8" height="8" fill="#f25022" />
    <rect x="13" y="3" width="8" height="8" fill="#7fba00" />
    <rect x="3" y="13" width="8" height="8" fill="#00a4ef" />
    <rect x="13" y="13" width="8" height="8" fill="#ffb900" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6l8-3Z" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.2 14.5a4.4 4.4 0 0 1 5.3 4.3" />
  </svg>
);

const ChartIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 20V10" />
    <path d="M10 20V6" />
    <path d="M15 20V12" />
    <path d="M20 20V4" />
  </svg>
);

export default LoginPage;
