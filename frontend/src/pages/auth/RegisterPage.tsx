import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import heroImage from "../../assets/img1.png";

const roles = [
  {
    value: "AffectedUser",
    title: "Affected User",
    description: "Receive alerts and request assistance",
  },
  {
    value: "FieldVolunteer",
    title: "Field Volunteer",
    description: "Support field operations and communities",
  },
  {
    value: "ReliefCoordinator",
    title: "Relief Coordinator",
    description: "Coordinate relief activities and resources",
  },
  {
    value: "SystemAdministrator",
    title: "System Administrator",
    description: "Manage users, platform and approvals",
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("AffectedUser");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!agree) {
      setError("Please agree to the platform terms and responsible-use policy.");
      return;
    }

    try {
      setLoading(true);

      await register(
        fullName.trim(),
        email.trim(),
        password,
        role
      );

      navigate("/pending");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef9fc] px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">

      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1180px] overflow-hidden rounded-[14px] border border-[#d8e9ef] bg-white shadow-[0_20px_60px_rgba(0,65,95,0.10)]">

        {/* ================= LEFT ================= */}
        <section className="flex w-full flex-col bg-white lg:w-[43%]">

          {/* LOGO */}
          <div className="px-8 pt-7 sm:px-10 lg:px-11">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex items-end gap-[3px]">
                <span className="h-4 w-[4px] rounded-full bg-[#48cbed]" />
                <span className="h-6 w-[4px] rounded-full bg-[#48cbed]" />
                <span className="h-5 w-[4px] rounded-full bg-[#48cbed]" />
              </span>

              <span className="text-[15px] font-extrabold tracking-[-0.5px] text-[#062f4d]">
                Relief<span className="text-[#09a9e5]">Nexus</span>
              </span>
            </Link>
          </div>

          {/* FORM CONTAINER */}
          <div className="flex flex-1 items-center px-8 py-8 sm:px-10 lg:px-11 lg:py-5">

            <div className="w-full">

              {/* HEADING */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-[2px] w-7 bg-[#08afe9]" />

                  <span className="text-[8px] font-extrabold tracking-[2px] text-[#079fd8]">
                    CREATE ACCOUNT
                  </span>
                </div>

                <h1 className="text-[32px] font-black leading-[0.98] tracking-[-1.8px] text-[#062f4d] sm:text-[35px]">
                  Join{" "}
                  <span className="text-[#09a9e5]">
                    ReliefNexus.
                  </span>
                </h1>

                <p className="mt-2.5 text-[10px] text-[#7893a3]">
                  Create your account and select your role.
                </p>
              </div>

              <form onSubmit={handleSubmit}>

                {/* ERROR */}
                {error && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-600">
                    {error}
                  </div>
                )}

                {/* FULL NAME */}
                <div className="mb-3">
                  <label className="mb-1.5 block text-[8px] font-bold text-[#173c55]">
                    Full name
                  </label>

                  <div className="flex h-[40px] overflow-hidden rounded-[6px] border border-[#cbdfe8] bg-white focus-within:border-[#09afe9]">
                    <span className="flex w-[34px] items-center justify-center border-r border-[#dfebf0] text-[10px] text-[#7896a7]">
                      ♙
                    </span>

                    <input
                      type="text"
                      value={fullName}
                      placeholder="Your full name"
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="min-w-0 flex-1 px-3 text-[10px] text-[#153b55] outline-none placeholder:text-[#9aafbb]"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="mb-3">
                  <label className="mb-1.5 block text-[8px] font-bold text-[#173c55]">
                    Email address
                  </label>

                  <div className="flex h-[40px] overflow-hidden rounded-[6px] border border-[#cbdfe8] bg-white focus-within:border-[#09afe9]">
                    <span className="flex w-[34px] items-center justify-center border-r border-[#dfebf0] text-[9px] text-[#7896a7]">
                      ✉
                    </span>

                    <input
                      type="email"
                      value={email}
                      placeholder="you@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="min-w-0 flex-1 px-3 text-[10px] text-[#153b55] outline-none placeholder:text-[#9aafbb]"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="mb-3 grid grid-cols-2 gap-3">

                  <div>
                    <label className="mb-1.5 block text-[8px] font-bold text-[#173c55]">
                      Password
                    </label>

                    <div className="flex h-[40px] overflow-hidden rounded-[6px] border border-[#cbdfe8] bg-white focus-within:border-[#09afe9]">
                      <span className="flex w-[32px] items-center justify-center border-r border-[#dfebf0] text-[9px] text-[#7896a7]">
                        ▣
                      </span>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder="Create a password"
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="min-w-0 flex-1 px-2 text-[10px] outline-none placeholder:text-[#9aafbb]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="bg-white px-2 text-[9px] font-medium text-[#079fdf]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8px] font-bold text-[#173c55]">
                      Confirm password
                    </label>

                    <div className="flex h-[40px] overflow-hidden rounded-[6px] border border-[#cbdfe8] bg-white focus-within:border-[#09afe9]">
                      <span className="flex w-[32px] items-center justify-center border-r border-[#dfebf0] text-[9px] text-[#7896a7]">
                        ▣
                      </span>

                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        placeholder="Confirm password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="min-w-0 flex-1 px-2 text-[10px] outline-none placeholder:text-[#9aafbb]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="bg-white px-2 text-[9px] font-medium text-[#079fdf]"
                      >
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                </div>

                {/* ROLE */}
                <div className="mb-3">
                  <label className="mb-1.5 block text-[8px] font-bold text-[#173c55]">
                    Select your role
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((item) => {
                      const selected = role === item.value;

                      return (
                        <label
                          key={item.value}
                          className={`flex min-h-[51px] cursor-pointer gap-2 rounded-[6px] border px-2.5 py-2 transition ${
                            selected
                              ? "border-[#08afe9] bg-[#eefaff]"
                              : "border-[#cbdfe8] bg-white hover:border-[#8ed8ed]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={item.value}
                            checked={selected}
                            onChange={() => setRole(item.value)}
                            className="mt-[2px] h-3 w-3 shrink-0 accent-[#08afe9]"
                          />

                          <span className="min-w-0">
                            <span className="block text-[8px] font-bold text-[#173c55]">
                              {item.title}
                            </span>

                            <span className="mt-0.5 block text-[6.5px] leading-[9px] text-[#8aa0ad]">
                              {item.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* TERMS */}
                <label className="mb-3 flex cursor-pointer items-center gap-2 text-[7px] text-[#8298a5]">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="h-3 w-3 accent-[#0874e8]"
                  />
                  I agree to the platform terms and responsible-use policy.
                </label>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#0874e8] text-[10px] font-bold text-white shadow-[0_8px_22px_rgba(8,116,232,0.18)] transition hover:bg-[#0668d5] disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create Account"}
                  {!loading && <span>→</span>}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="my-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#dce8ed]" />
                <span className="text-[7px] text-[#91a5b1]">
                  Or sign up with
                </span>
                <span className="h-px flex-1 bg-[#dce8ed]" />
              </div>

              {/* SOCIAL */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex h-[34px] items-center justify-center gap-2 rounded-[6px] border border-[#cbdfe8] bg-white text-[9px] text-[#29475b]"
                >
                  <strong className="text-[12px] text-[#0874e8]">G</strong>
                  Google
                </button>

                <button
                  type="button"
                  className="flex h-[34px] items-center justify-center gap-2 rounded-[6px] border border-[#cbdfe8] bg-white text-[9px] text-[#29475b]"
                >
                  <strong className="text-[10px] text-[#0874e8]">▦</strong>
                  Microsoft
                </button>
              </div>

              {/* LOGIN */}
              <p className="mt-3 text-center text-[7px] text-[#8197a4]">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#078fdd]"
                >
                  Sign in
                </Link>
              </p>

            </div>
          </div>
        </section>

        {/* ================= RIGHT IMAGE ================= */}
        <section className="relative hidden overflow-hidden lg:block lg:w-[57%]">

          <img
            src={heroImage}
            alt="ReliefNexus disaster resilience"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#003b57]/30 via-[#003d58]/35 to-[#001c2d]/95" />

          {/* LARGE CIRCLE */}
          <div className="absolute -left-[300px] -top-[240px] h-[650px] w-[650px] rounded-full border border-cyan-300/20" />

          {/* LOGO */}
          <div className="absolute left-8 top-7 z-10 flex items-center gap-2.5">
            <span className="flex items-end gap-[3px]">
              <span className="h-4 w-[4px] rounded-full bg-[#45d0f2]" />
              <span className="h-6 w-[4px] rounded-full bg-[#45d0f2]" />
              <span className="h-5 w-[4px] rounded-full bg-[#45d0f2]" />
            </span>

            <span className="text-[14px] font-extrabold text-white">
              Relief<span className="text-[#45d0f2]">Nexus</span>
            </span>
          </div>

          {/* IMAGE CONTENT */}
          <div className="absolute bottom-0 left-0 z-10 px-9 pb-10 xl:px-10">

            <div className="mb-4 flex items-center gap-3">
              <span className="h-[2px] w-7 bg-[#43d1f3]" />

              <span className="text-[8px] font-extrabold tracking-[2px] text-[#43d1f3]">
                JOIN THE PLATFORM
              </span>
            </div>

            <h2 className="text-[42px] font-black leading-[0.94] tracking-[-2px] text-white xl:text-[48px]">
              Create Your
              <br />
              <span className="text-[#45cdf2]">
                Account.
              </span>
            </h2>

            <p className="mt-5 max-w-[390px] text-[10px] leading-[18px] text-white/90">
              Become part of a connected disaster resilience ecosystem built
              to protect people and communities.
            </p>

            <div className="mt-5 border-l-2 border-[#42d0f3] pl-3">
              <p className="text-[9px] font-medium leading-[15px] text-white">
                "People Prepared.
                <br />
                Communities Protected."
              </p>
            </div>

            <div className="mt-9">
              <p className="text-[8px] font-extrabold tracking-[1.5px] text-white">
                RELIEFNEXUS
              </p>

              <p className="mt-1 text-[7px] text-white/60">
                AI-powered disaster intelligence
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
