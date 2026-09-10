import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import img1 from "../../assets/img1.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(
        email.trim(),
        password
      );

      if (user.role === "SystemAdministrator") {
        navigate("/dashboard/system-administrator");
      } else if (user.role === "ReliefCoordinator") {
        navigate("/dashboard/relief-coordinator");
      } else if (user.role === "FieldVolunteer") {
        navigate("/dashboard/field-volunteer");
      } else if (user.role === "AffectedUser") {
        navigate("/dashboard/affected-user");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login failed:", err);

      const message =
        err?.response?.data?.message ||
        "Invalid email or password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef7fb] p-0 md:p-7">

      <div className="mx-auto flex min-h-screen max-w-7xl overflow-hidden bg-white shadow-sm md:min-h-[calc(100vh-56px)] md:rounded-2xl">

        {/* =====================================================
            LEFT - LOGIN
        ====================================================== */}

        <section className="flex w-full flex-col lg:w-[55%]">

          {/* Logo */}
          <div className="px-7 py-7 sm:px-10 lg:px-14">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <LogoIcon />
              </div>

              <span className="text-base font-bold tracking-tight text-[#101c35]">
                Relief<span className="text-blue-600">Nexus</span>
              </span>
            </button>
          </div>

          {/* Form area */}
          <div className="flex flex-1 items-center px-7 pb-10 sm:px-10 lg:px-14">

            <div className="mx-auto w-full max-w-md">

              {/* Heading */}
              <div className="mb-8">

                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-10 bg-blue-600" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600">
                    Welcome back
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[#101c35] sm:text-4xl">
                  Sign in to{" "}
                  <span className="text-blue-600">
                    continue.
                  </span>
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Sign in to access your ReliefNexus dashboard.
                </p>

              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertIcon />

                  <p>{error}</p>
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Email address
                  </label>

                  <div className="group flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                    <div className="flex w-12 shrink-0 items-center justify-center border-r border-slate-100 bg-slate-50 text-slate-400">
                      <MailIcon />
                    </div>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />

                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setError(
                          "Password recovery is not available yet."
                        );
                      }}
                      className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="group flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                    <div className="flex w-12 shrink-0 items-center justify-center border-r border-slate-100 bg-slate-50 text-slate-400">
                      <LockIcon />
                    </div>

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      className="px-4 text-xs font-semibold text-blue-600 transition hover:bg-slate-50"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>
                </div>

                {/* Remember */}
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="text-xs text-slate-500">
                    Remember me
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon />
                    </>
                  )}
                </button>

              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-[10px] font-medium text-slate-400">
                  Or continue with
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <GoogleIcon />
                  Google
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <MicrosoftIcon />
                  Microsoft
                </button>

              </div>

              {/* Register */}
              <p className="mt-7 text-center text-xs text-slate-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-bold text-blue-600 hover:text-blue-700"
                >
                  Sign up
                </button>
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            RIGHT - IMAGE
        ====================================================== */}

        <section className="relative hidden overflow-hidden bg-[#101c35] lg:block lg:w-[45%]">

          <img
            src={img1}
            alt="ReliefNexus disaster resilience"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#071226] via-[#071226]/35 to-blue-900/10" />

          {/* Decorative circle */}
          <div className="absolute -left-32 -top-28 h-[420px] w-[420px] rounded-full border border-white/20" />

          <div className="absolute -left-20 -top-16 h-[300px] w-[300px] rounded-full border border-white/10" />

          {/* Top logo */}
          <div className="absolute left-7 top-7 flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <LogoIcon />
            </div>

            <span className="text-sm font-bold">
              ReliefNexus
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-9 left-8 right-8">

            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-blue-400" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-300">
                Disaster resilience
              </span>
            </div>

            <h2 className="max-w-md text-4xl font-extrabold leading-[1.05] tracking-tight text-white xl:text-5xl">
              Stronger
              <br />
              Communities.
              <br />
              Through
              <br />
              <span className="text-blue-400">
                Smarter Solutions.
              </span>
            </h2>

            <div className="mt-5 h-px w-8 bg-white/50" />

            <p className="mt-4 max-w-sm text-xs leading-5 text-slate-200">
              "Prepared today.
              <br />
              Safer tomorrow."
            </p>

            <div className="mt-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                ReliefNexus
              </p>

              <p className="mt-1 text-[9px] text-slate-300">
                AI-powered disaster intelligence
              </p>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
};

/* =========================================================
   ICONS
========================================================= */

const LogoIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M5 20V10" />
    <path d="M10 20V6" />
    <path d="M15 20V3" />
    <path d="M20 20V8" />
  </svg>
);

const MailIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
    />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect
      x="5"
      y="10"
      width="14"
      height="11"
      rx="2"
    />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10.3 3.3 2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeOpacity="0.3"
      strokeWidth="3"
    />

    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
  >
    <path
      fill="#4285F4"
      d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.22Z"
    />
    <path
      fill="#34A853"
      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.5A9.75 9.75 0 0 0 12 21.75Z"
    />
    <path
      fill="#FBBC05"
      d="M6.54 13.85a5.86 5.86 0 0 1 0-3.7v-2.5H3.29a9.75 9.75 0 0 0 0 8.7l3.25-2.5Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.12c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.4l3.25 2.5C7.31 7.84 9.46 6.12 12 6.12Z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="3" width="8" height="8" fill="#f25022" />
    <rect x="13" y="3" width="8" height="8" fill="#7fba00" />
    <rect x="3" y="13" width="8" height="8" fill="#00a4ef" />
    <rect x="13" y="13" width="8" height="8" fill="#ffb900" />
  </svg>
);

export default LoginPage;