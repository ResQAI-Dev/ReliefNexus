import { Link, useLocation } from "react-router-dom";

const PendingPage = () => {
  const location = useLocation();

  const email =
    location.state?.email || "your email address";

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.10),transparent_38%)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Main glass card */}
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left brand / status panel */}
            <div className="relative flex flex-col justify-between overflow-hidden border-b border-white/10 bg-gradient-to-br from-cyan-500/[0.13] via-blue-500/[0.07] to-transparent p-8 sm:p-10 lg:border-b-0 lg:border-r">
              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-3 transition-opacity hover:opacity-90"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                    <span className="flex items-end gap-[3px]">
                      <span className="h-3 w-[3px] rounded-full bg-white" />
                      <span className="h-5 w-[3px] rounded-full bg-white" />
                      <span className="h-4 w-[3px] rounded-full bg-white" />
                    </span>
                  </span>

                  <span className="text-lg font-bold tracking-tight">
                    Relief<span className="text-cyan-400">Nexus</span>
                    <span className="mt-0.5 block text-[8px] font-medium uppercase tracking-[0.22em] text-slate-400">
                      Disaster Management Platform
                    </span>
                  </span>
                </Link>

                <div className="mt-14">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
                    Registration received
                  </div>

                  <h2 className="max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                    Welcome to a{" "}
                    <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      safer response network.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
                    Your registration is securely recorded. Once your role is
                    reviewed, you can access the ReliefNexus disaster
                    management platform.
                  </p>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-2">
                {[
                  ["01", "Connect"],
                  ["02", "Review"],
                  ["03", "Activate"],
                ].map(([number, label]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                  >
                    <div className="text-[10px] font-bold text-cyan-300">
                      {number}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-200">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right content */}
            <div className="bg-slate-950/35 p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-xl">
                {/* Success icon */}
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_45px_rgba(52,211,153,0.12)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-black text-slate-950 shadow-lg">
                    
                  </div>
                </div>

                <div className="mt-7">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Registration submitted
                  </span>

                  <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                    Your account is{" "}
                    <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      awaiting approval.
                    </span>
                  </h1>

                  <p className="mt-5 text-sm leading-7 text-slate-300">
                    Thank you for joining ReliefNexus. Your registration has
                    been submitted successfully.
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    A System Administrator needs to review and approve your
                    selected role before you can sign in.
                  </p>
                </div>

                {/* Email */}
                <div className="mt-7 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-cyan-300">
                      @
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Registered email
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold text-white">
                        {email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-7">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Approval process
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Step 1 of 3
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-2">
                    <div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-black text-slate-950">
                        
                      </div>
                      <div className="mt-2 text-xs font-bold text-white">
                        Submitted
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-400">
                        Completed
                      </div>
                    </div>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-cyan-400/70 to-white/10" />

                    <div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xs font-black text-cyan-300">
                        2
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-300">
                        Review
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        Pending
                      </div>
                    </div>

                    <div className="mt-4 h-px w-full bg-white/10" />

                    <div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-black text-slate-500">
                        3
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-500">
                        Activated
                      </div>
                      <div className="mt-1 text-[10px] text-slate-600">
                        After approval
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-9 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Link
                    to="/login"
                    className="group inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/15 transition-all hover:-translate-y-0.5 hover:shadow-cyan-500/25"
                  >
                    Go to Sign In
                    <span className="transition-transform group-hover:translate-x-1">
                      
                    </span>
                  </Link>

                  <Link
                    to="/"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    Back to ReliefNexus
                  </Link>
                </div>

                <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-cyan-300">
                    
                  </span>
                  <p className="text-[10px] leading-5 text-slate-500">
                    Your registration details remain protected while your
                    account is being reviewed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
          ReliefNexus  Smarter disaster response  Connected communities
        </p>
      </div>
    </div>
  );
};

export default PendingPage;
