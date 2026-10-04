import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import heroImage from "../../../assets/img1.png";

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

type FieldErrors = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  district?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  agree?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_REGEX = /^\+?[0-9\s()-]{9,16}$/;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("AffectedUser");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 6,
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const profileCompletion = useMemo(() => {
    const checks = [
      fullName.trim(),
      email.trim(),
      phoneNumber.trim(),
      dateOfBirth,
      gender,
      address.trim(),
      district.trim(),
      emergencyContactName.trim(),
      emergencyContactPhone.trim(),
      password,
      confirmPassword,
      role,
      agree,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    fullName,
    email,
    phoneNumber,
    dateOfBirth,
    gender,
    address,
    district,
    emergencyContactName,
    emergencyContactPhone,
    password,
    confirmPassword,
    role,
    agree,
  ]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!fullName.trim()) {
      next.fullName = "Full name is required.";
    } else if (fullName.trim().length < 2) {
      next.fullName = "Please enter your full name.";
    }

    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (phoneNumber.trim() && !PHONE_REGEX.test(phoneNumber.trim())) {
      next.phoneNumber = "Enter a valid phone number.";
    }

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (Number.isNaN(dob.getTime())) {
        next.dateOfBirth = "Enter a valid date.";
      } else if (dob > today) {
        next.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }

    if (!gender) {
      next.gender = "Please select your gender.";
    }

    if (!address.trim()) {
      next.address = "Address is required.";
    }

    if (!district.trim()) {
      next.district = "District is required.";
    }

    if (!emergencyContactName.trim()) {
      next.emergencyContactName = "Emergency contact name is required.";
    }

    if (!emergencyContactPhone.trim()) {
      next.emergencyContactPhone = "Emergency contact phone is required.";
    } else if (!PHONE_REGEX.test(emergencyContactPhone.trim())) {
      next.emergencyContactPhone = "Enter a valid phone number.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (!passwordChecks.length) {
      next.password = "Password must contain at least 6 characters.";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    if (!role) {
      next.role = "Please select a role.";
    }

    if (!agree) {
      next.agree = "You must accept the terms before creating an account.";
    }

    return next;
  };

  const validateField = (field: keyof FieldErrors): string => {
    const all = validate();
    return all[field] || "";
  };

  const markTouched = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const message = validateField(field);
    setErrors((prev) => ({
      ...prev,
      [field]: message || undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");

    const nextErrors = validate();
    setErrors(nextErrors);

    const allTouched: Record<string, boolean> = {};
    Object.keys(nextErrors).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = Object.keys(nextErrors)[0];
      document
        .getElementById(`register-${firstInvalid}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setLoading(true);

      await register(
        fullName.trim(),
        email.trim(),
        password,
        role,
        phoneNumber.trim(),
        dateOfBirth,
        gender,
        address.trim(),
        district.trim(),
        emergencyContactName.trim(),
        emergencyContactPhone.trim()
      );

      navigate("/pending");
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FieldErrors) =>
    `rn-register-field h-[42px] w-full rounded-xl border bg-slate-50/60 px-3 text-[10px] font-medium text-[#153b55] outline-none placeholder:text-slate-400 ${
      touched[field] && errors[field]
        ? "border-red-400 bg-red-50/40 focus-within:border-red-500"
        : touched[field] && !errors[field]
          ? "border-emerald-300"
          : "border-slate-200"
    }`;

  return (
    <>
      <style>{`
        @keyframes rnRegisterGlow {
          0%, 100% { box-shadow: 0 35px 100px rgba(7,67,102,.12), 0 0 0 1px rgba(255,255,255,.75); }
          50% { box-shadow: 0 40px 115px rgba(8,116,232,.17), 0 0 0 1px rgba(125,211,252,.25); }
        }
        @keyframes rnRegisterFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rnRegisterShimmer {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(130%); }
        }
        @keyframes rnRegisterSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rn-register-card { animation: rnRegisterGlow 5s ease-in-out infinite; }
        .rn-register-float { animation: rnRegisterFloat 5s ease-in-out infinite; }
        .rn-register-orbit { animation: rnRegisterSpin 28s linear infinite; }
        .rn-register-shimmer {
          position:absolute; inset:0; width:42%; pointer-events:none;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);
          transform:translateX(-130%); animation:rnRegisterShimmer 8s ease-in-out infinite;
        }
        .rn-register-field {
          transition:border-color .2s ease,box-shadow .2s ease,background .2s ease,transform .2s ease;
        }
        .rn-register-field:focus {
          border-color:#38bdf8;
          background:#fff;
          box-shadow:0 0 0 4px rgba(14,165,233,.08);
          transform:translateY(-1px);
        }
        .rn-register-role {
          transition:transform .2s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease;
        }
        .rn-register-role:hover {
          transform:translateY(-2px);
          border-color:#7dd3fc;
          box-shadow:0 8px 20px rgba(14,165,233,.07);
        }
        .rn-register-submit {
          transition:transform .2s ease,box-shadow .2s ease,filter .2s ease;
        }
        .rn-register-submit:hover:not(:disabled) {
          transform:translateY(-2px);
          filter:brightness(1.04);
          box-shadow:0 16px 32px rgba(8,116,232,.28);
        }
        .rn-register-submit:active:not(:disabled) { transform:translateY(0); }
        .rn-glass { background:rgba(5,27,44,.38); border:1px solid rgba(255,255,255,.14); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
        .rn-step { transition:all .25s ease; }
        .rn-step-active { box-shadow:0 0 0 5px rgba(56,189,248,.12); }
        @media (prefers-reduced-motion:reduce) {
          .rn-register-card,.rn-register-float,.rn-register-orbit,.rn-register-shimmer { animation:none!important; }
        }
      `}</style>

      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,.18),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(37,99,235,.12),transparent_30%),linear-gradient(135deg,#f7fcff_0%,#eef9ff_48%,#f8fcff_100%)] px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="rn-register-card mx-auto flex min-h-[calc(100vh-24px)] max-w-[1480px] overflow-hidden rounded-[32px] border border-white/80 bg-white/95 shadow-[0_35px_100px_rgba(7,67,102,.14)] backdrop-blur-xl sm:min-h-[calc(100vh-40px)] lg:min-h-[850px]">

          <section className="relative flex w-full flex-col overflow-hidden bg-white lg:w-[54%]">
            <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl" />
            <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />

            {/* PROFESSIONAL HEADER */}
            <div className="relative z-10 flex items-center justify-between px-7 py-5 sm:px-9 lg:px-11">
              <Link to="/" className="group flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
                  <LogoIcon />
                </span>
                <span className="leading-none">
                  <span className="block text-[15px] font-extrabold tracking-[-.5px] text-[#062f4d]">
                    Relief<span className="text-sky-500">Nexus</span>
                  </span>
                  <span className="mt-1 block text-[6.5px] font-bold uppercase tracking-[.22em] text-slate-400">
                    Disaster Management Platform
                  </span>
                </span>
              </Link>

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 shadow-sm sm:flex">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><ShieldIcon /></span>
                <span className="text-[7px] font-extrabold uppercase tracking-[.16em] text-slate-500">Secure registration</span>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 px-7 pb-8 sm:px-9 lg:px-11">
              <div className="mx-auto w-full max-w-[650px]">

                <div className="mb-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />
                      <span className="text-[7px] font-extrabold uppercase tracking-[.18em] text-sky-700">
                        Secure account setup
                      </span>
                    </div>
                    <span className="text-[7px] font-bold uppercase tracking-[.16em] text-slate-400">
                      Step 1  Profile
                    </span>
                  </div>

                  <div className="mb-2.5 flex items-center gap-3">
                    <span className="h-[2px] w-9 bg-gradient-to-r from-blue-600 to-cyan-400" />
                    <span className="text-[8px] font-extrabold uppercase tracking-[.24em] text-sky-600">
                      Create account
                    </span>
                  </div>
                  <h1 className="text-[34px] font-black leading-[.95] tracking-[-1.8px] text-[#062f4d] sm:text-[40px]">
                    Join{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                      ReliefNexus.
                    </span>
                  </h1>
                  <p className="mt-2 text-[10px] leading-5 text-slate-400">
                    Create your account and select the role that matches your responsibilities.
                  </p>

                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-[0_10px_30px_rgba(15,65,95,.05)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-extrabold text-[#173c55]">Profile completion</p>
                        <p className="mt-0.5 text-[6.5px] text-slate-400">Finish the required details to activate your account.</p>
                      </div>
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-black text-sky-600">{profileCompletion}%</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <StepChip active label="Profile" />
                      <StepChip label="Security" />
                      <StepChip label="Confirmation" />
                    </div>
                  </div>
                </div>

                {serverError && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[9px] leading-4 text-red-700">
                    <AlertIcon />
                    <div>
                      <p className="font-extrabold">Registration could not be completed</p>
                      <p className="mt-0.5">{serverError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-2.5">

                  <Field label="Full name" error={touched.fullName ? errors.fullName : undefined} required>
                    <input
                      id="register-fullName"
                      type="text"
                      value={fullName}
                      placeholder="Your full name"
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (touched.fullName) markTouched("fullName");
                      }}
                      onBlur={() => markTouched("fullName")}
                      autoComplete="name"
                      className={inputClass("fullName")}
                    />
                  </Field>

                  <Field label="Email address" error={touched.email ? errors.email : undefined} required>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      placeholder="you@example.com"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) markTouched("email");
                      }}
                      onBlur={() => markTouched("email")}
                      autoComplete="email"
                      className={inputClass("email")}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Phone number" error={touched.phoneNumber ? errors.phoneNumber : undefined}>
                      <input
                        id="register-phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        placeholder="+94 7X XXX XXXX"
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (touched.phoneNumber) markTouched("phoneNumber");
                        }}
                        onBlur={() => markTouched("phoneNumber")}
                        autoComplete="tel"
                        className={inputClass("phoneNumber")}
                      />
                    </Field>

                    <Field label="Date of birth" error={touched.dateOfBirth ? errors.dateOfBirth : undefined}>
                      <input
                        id="register-dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          if (touched.dateOfBirth) markTouched("dateOfBirth");
                        }}
                        onBlur={() => markTouched("dateOfBirth")}
                        className={inputClass("dateOfBirth")}
                      />
                    </Field>
                  </div>

                  <Field label="Gender" error={touched.gender ? errors.gender : undefined} required>
                    <select
                      id="register-gender"
                      value={gender}
                      onChange={(e) => {
                        setGender(e.target.value);
                        if (touched.gender) markTouched("gender");
                      }}
                      onBlur={() => markTouched("gender")}
                      className={inputClass("gender")}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Address" error={touched.address ? errors.address : undefined} required>
                    <input
                      id="register-address"
                      type="text"
                      value={address}
                      placeholder="Your residential address"
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (touched.address) markTouched("address");
                      }}
                      onBlur={() => markTouched("address")}
                      autoComplete="street-address"
                      className={inputClass("address")}
                    />
                  </Field>

                  <Field label="District" error={touched.district ? errors.district : undefined} required>
                    <input
                      id="register-district"
                      type="text"
                      value={district}
                      placeholder="Your district"
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        if (touched.district) markTouched("district");
                      }}
                      onBlur={() => markTouched("district")}
                      className={inputClass("district")}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Field
                      label="Emergency contact name"
                      error={touched.emergencyContactName ? errors.emergencyContactName : undefined}
                      required
                    >
                      <input
                        id="register-emergencyContactName"
                        type="text"
                        value={emergencyContactName}
                        placeholder="Contact person's name"
                        onChange={(e) => {
                          setEmergencyContactName(e.target.value);
                          if (touched.emergencyContactName) markTouched("emergencyContactName");
                        }}
                        onBlur={() => markTouched("emergencyContactName")}
                        className={inputClass("emergencyContactName")}
                      />
                    </Field>

                    <Field
                      label="Emergency contact phone"
                      error={touched.emergencyContactPhone ? errors.emergencyContactPhone : undefined}
                      required
                    >
                      <input
                        id="register-emergencyContactPhone"
                        type="tel"
                        value={emergencyContactPhone}
                        placeholder="+94 7X XXX XXXX"
                        onChange={(e) => {
                          setEmergencyContactPhone(e.target.value);
                          if (touched.emergencyContactPhone) markTouched("emergencyContactPhone");
                        }}
                        onBlur={() => markTouched("emergencyContactPhone")}
                        className={inputClass("emergencyContactPhone")}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Password" error={touched.password ? errors.password : undefined} required>
                      <div className="rn-register-field flex h-[42px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,165,233,.08)]">
                        <input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          placeholder="Create a password"
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (touched.password) markTouched("password");
                          }}
                          onBlur={() => markTouched("password")}
                          autoComplete="new-password"
                          className="min-w-0 flex-1 bg-transparent px-3 text-[10px] font-medium text-[#153b55] outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="px-2.5 text-[9px] font-extrabold text-sky-600 hover:bg-sky-50"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      <div className="mt-1.5 flex gap-1">
                        {[0, 1, 2, 3].map((index) => (
                          <span
                            key={index}
                            className={`h-1 flex-1 rounded-full ${
                              passwordScore > index
                                ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[6.5px]">
                        <PasswordRule ok={passwordChecks.length} label="6+ characters" />
                        <PasswordRule ok={passwordChecks.upper} label="Uppercase letter" />
                        <PasswordRule ok={passwordChecks.number} label="Number" />
                        <PasswordRule ok={passwordChecks.special} label="Special character" />
                      </div>
                    </Field>

                    <Field
                      label="Confirm password"
                      error={touched.confirmPassword ? errors.confirmPassword : undefined}
                      required
                    >
                      <div className="rn-register-field flex h-[42px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,165,233,.08)]">
                        <input
                          id="register-confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          placeholder="Confirm password"
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (touched.confirmPassword) markTouched("confirmPassword");
                          }}
                          onBlur={() => markTouched("confirmPassword")}
                          autoComplete="new-password"
                          className="min-w-0 flex-1 bg-transparent px-3 text-[10px] font-medium text-[#153b55] outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="px-2.5 text-[9px] font-extrabold text-sky-600 hover:bg-sky-50"
                        >
                          {showConfirm ? "Hide" : "Show"}
                        </button>
                      </div>
                    </Field>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[8px] font-extrabold text-[#173c55]">
                        Select your role <span className="text-red-500">*</span>
                      </label>
                      {touched.role && errors.role && (
                        <span className="text-[7px] font-semibold text-red-500">{errors.role}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {roles.map((item) => {
                        const selected = role === item.value;

                        return (
                          <label
                            key={item.value}
                            className={`rn-register-role flex min-h-[48px] cursor-pointer gap-2 rounded-xl border px-2.5 py-2 ${
                              selected
                                ? "border-sky-400 bg-sky-50/80 shadow-[0_7px_18px_rgba(14,165,233,.08)]"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={item.value}
                              checked={selected}
                              onChange={() => {
                                setRole(item.value);
                                setTouched((prev) => ({ ...prev, role: true }));
                                setErrors((prev) => ({ ...prev, role: undefined }));
                              }}
                              className="mt-0.5 h-3 w-3 shrink-0 accent-sky-500"
                            />
                            <span className="min-w-0">
                              <span className="block text-[8px] font-extrabold text-[#173c55]">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block text-[6.5px] leading-[9px] text-slate-400">
                                {item.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-2 pt-0.5 text-[7px] leading-4 text-slate-400">
                    <input
                      id="register-agree"
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => {
                        setAgree(e.target.checked);
                        setTouched((prev) => ({ ...prev, agree: true }));
                        setErrors((prev) => ({
                          ...prev,
                          agree: e.target.checked
                            ? undefined
                            : "You must accept the terms.",
                        }));
                      }}
                      className="mt-0.5 h-3 w-3 shrink-0 accent-blue-600"
                    />
                    <span>
                      I agree to the platform terms and responsible-use policy.
                      {touched.agree && errors.agree && (
                        <span className="ml-1 font-semibold text-red-500">{errors.agree}</span>
                      )}
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rn-register-submit flex h-[43px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-[10px] font-extrabold text-white shadow-[0_10px_24px_rgba(8,116,232,.20)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Secure Account
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[7px] font-medium text-slate-400">Or sign up with</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    className="flex h-[35px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[9px] font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <GoogleIcon />
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex h-[35px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[9px] font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <MicrosoftIcon />
                    Microsoft
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-[6.5px] font-semibold text-slate-400">
                  <ShieldIcon />
                  Your account details are validated before submission.
                </div>

                <div className="mt-4 flex justify-center">
                  <Link
                    to="/login"
                    className="group inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-5 py-2.5 text-[9px] font-semibold text-slate-500 shadow-[0_5px_18px_rgba(14,165,233,.06)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
                  >
                    Already have an account?
                    <span className="font-extrabold text-sky-600">
                      Sign in
                    </span>
                    <span className="text-sky-500 transition group-hover:translate-x-0.5">
                      
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT  PREMIUM DISASTER VISUAL */}
          <section className="relative hidden overflow-hidden bg-[#06243a] lg:block lg:w-[46%]">
            <img
              src="/images/reliefnexus-register-hero-clean.png"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = heroImage;
                }}
              alt="ReliefNexus emergency response and disaster relief operation"
              className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center transition-transform duration-[1600ms] hover:scale-[1.05]"
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,50,.10)_0%,rgba(3,31,50,.22)_34%,rgba(2,18,32,.90)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(56,189,248,.20),transparent_32%),radial-gradient(circle_at_18%_75%,rgba(14,165,233,.18),transparent_36%)]" />

            <div className="rn-register-shimmer" />
            <div className="rn-register-orbit absolute -left-48 -top-48 h-[650px] w-[650px] rounded-full border border-white/10" />
            <div className="absolute -left-28 -top-28 h-[430px] w-[430px] rounded-full border border-cyan-300/10" />

            <div className="absolute left-7 right-7 top-7 z-10 flex items-center justify-between sm:left-9 sm:right-9">
              <div className="flex items-center gap-2.5 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
                  <LogoIcon />
                </div>
                <div>
                  <p className="text-sm font-extrabold">
                    Relief<span className="text-cyan-300">Nexus</span>
                  </p>
                  <p className="text-[6.5px] font-bold uppercase tracking-[.2em] text-slate-300">
                    Disaster Intelligence
                  </p>
                </div>
              </div>

              <div className="rn-register-float hidden items-center gap-2 rounded-full border border-white/15 bg-slate-950/35 px-3.5 py-2 text-[8px] font-bold text-white backdrop-blur-xl sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                Build safer communities
              </div>
            </div>

            <div className="rn-register-float absolute right-7 top-[18%] hidden w-[190px] rounded-2xl border border-white/15 bg-slate-950/35 p-4 shadow-[0_18px_45px_rgba(0,0,0,.16)] backdrop-blur-xl xl:block">
              <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-cyan-300">
                Connected response
              </p>
              <div className="mt-3 space-y-2">
                <InfoRow label="Community alerts" />
                <InfoRow label="Relief coordination" />
                <InfoRow label="AI risk intelligence" />
              </div>
            </div>

            <div className="absolute right-7 top-[40%] hidden w-[190px] rounded-2xl border border-white/15 bg-slate-950/35 p-4 shadow-[0_18px_45px_rgba(0,0,0,.16)] backdrop-blur-xl xl:block">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-[.15em] text-cyan-300">
                  Setup progress
                </span>
                <span className="text-[9px] font-black text-white">{profileCompletion}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <p className="text-[7px] text-slate-400">Security</p>
                  <p className="mt-0.5 text-[8px] font-bold text-white">
                    {passwordScore >= 3 ? "Strong" : "Building"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <p className="text-[7px] text-slate-400">Required</p>
                  <p className="mt-0.5 text-[8px] font-bold text-white">
                    {Object.keys(errors).length === 0 ? "Ready" : `${Object.keys(errors).length} left`}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-9 sm:px-9 xl:px-10">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-[2px] w-9 bg-cyan-300" />
                <span className="text-[8px] font-extrabold uppercase tracking-[.24em] text-cyan-200">
                  Join the response network
                </span>
              </div>

              <h2 className="text-[43px] font-black leading-[.92] tracking-[-2px] text-white xl:text-[52px]">
                Build Your
                <br />
                <span className="text-cyan-300">Response Network.</span>
              </h2>

              <p className="mt-5 max-w-[410px] text-[10px] leading-[17px] text-white/85">
                Join a connected disaster-response ecosystem designed to help protect communities, coordinate resources and support faster action.
              </p>

              <div className="mt-5 border-l-2 border-cyan-300 pl-3">
                <p className="text-[9px] font-semibold leading-[15px] text-white">
                  People Prepared.
                  <br />
                  Communities Protected.
                </p>
              </div>

              <div className="mb-3 flex items-center gap-2 text-[7px] font-semibold text-white/65">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Real-time coordination  AI-assisted decisions  Community-first response
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniCard icon={<ShieldIcon />} title="Protect" />
                <MiniCard icon={<PeopleIcon />} title="Connect" />
                <MiniCard icon={<ChartIcon />} title="Respond" />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="h-1 w-11 rounded-full bg-cyan-300" />
                <span className="h-1 w-6 rounded-full bg-white/25" />
                <span className="h-1 w-6 rounded-full bg-white/25" />
                <span className="ml-auto text-[7px] font-semibold text-slate-300">
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

const StepChip = ({ active = false, label }: { active?: boolean; label: string }) => (
  <div className={`rn-step flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${active ? "rn-step-active border-sky-200 bg-sky-50 text-sky-700" : "border-slate-100 bg-slate-50 text-slate-400"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-sky-500" : "bg-slate-300"}`} />
    <span className="text-[6.5px] font-extrabold">{label}</span>
  </div>
);

const Field = ({
  label,
  children,
  error,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) => (
  <div>
    <label className="mb-1.5 block text-[8px] font-extrabold text-[#173c55]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-[7px] font-semibold leading-3 text-red-500">
        {error}
      </p>
    )}
  </div>
);

const PasswordRule = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`flex items-center gap-1 ${ok ? "text-emerald-600" : "text-slate-400"}`}>
    <span className={`flex h-2.5 w-2.5 items-center justify-center rounded-full ${
      ok ? "bg-emerald-100" : "bg-slate-100"
    }`}>
      {ok ? "" : ""}
    </span>
    {label}
  </span>
);

const InfoRow = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
    <span className="truncate text-[8px] font-semibold text-slate-200">{label}</span>
  </div>
);

const MiniCard = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2.5 backdrop-blur-xl">
    <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
      {icon}
    </div>
    <p className="text-[8px] font-extrabold text-white">{title}</p>
  </div>
);

const LogoIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 20V10" />
    <path d="M10 20V6" />
    <path d="M15 20V3" />
    <path d="M20 20V8" />
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path d="M10.3 3.3 2.2 17a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.22Z" />
    <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.5A9.75 9.75 0 0 0 12 21.75Z" />
    <path fill="#FBBC05" d="M6.54 13.85a5.86 5.86 0 0 1 0-3.7v-2.5H3.29a9.75 9.75 0 0 0 0 8.7l3.25-2.5Z" />
    <path fill="#EA4335" d="M12 6.12c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.4l3.25 2.5C7.31 7.84 9.46 6.12 12 6.12Z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <rect x="3" y="3" width="8" height="8" fill="#f25022" />
    <rect x="13" y="3" width="8" height="8" fill="#7fba00" />
    <rect x="3" y="13" width="8" height="8" fill="#00a4ef" />
    <rect x="13" y="13" width="8" height="8" fill="#ffb900" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6l8-3Z" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.2 14.5a4.4 4.4 0 0 1 5.3 4.3" />
  </svg>
);

const ChartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 20V10" />
    <path d="M10 20V6" />
    <path d="M15 20V12" />
    <path d="M20 20V4" />
  </svg>
);

export default RegisterPage;


