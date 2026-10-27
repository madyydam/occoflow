import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Lock, AtSign, Mail, Phone, User, Building2,
  ShieldCheck, ChevronDown, Check, Search, XCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/crm-data";
import { supabase } from "@/lib/supabase";

export interface AuthFlipCardProps {
  initialMode: "login" | "signup";
  redirect?: string | undefined;
  initialPlan?: string | undefined;
  initialBilling?: string | undefined;
  initialOnboardingType?: "trial" | "purchase" | undefined;
}

interface FieldErrors {
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

/** Country entry for phone country code picker */
interface Country {
  code: string;       // "IN"
  name: string;       // "India"
  dialCode: string;   // "+91"
  flag: string;       // "🇮🇳"
}

const COUNTRIES: Country[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
];

/** Detect default country based on user's browser timezone */
function getDefaultCountry(): Country {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("India")) {
      return COUNTRIES.find((c) => c.code === "IN")!;
    }
    if (tz.includes("Dubai")) {
      return COUNTRIES.find((c) => c.code === "AE")!;
    }
    if (tz.includes("London")) {
      return COUNTRIES.find((c) => c.code === "GB")!;
    }
    if (tz.includes("New_York") || tz.includes("Los_Angeles") || tz.includes("Chicago") || tz.includes("America")) {
      return COUNTRIES.find((c) => c.code === "US")!;
    }
    if (tz.includes("Toronto") || tz.includes("Vancouver")) {
      return COUNTRIES.find((c) => c.code === "CA")!;
    }
    if (tz.includes("Sydney") || tz.includes("Melbourne")) {
      return COUNTRIES.find((c) => c.code === "AU")!;
    }
    if (tz.includes("Singapore")) {
      return COUNTRIES.find((c) => c.code === "SG")!;
    }
  } catch {
    // fallback
  }
  return COUNTRIES[0]!; // Default to India 🇮🇳 +91
}

/** Password strength calculation */
interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  bgColor: string;
  percent: number;
}

function calculatePasswordStrength(pass: string): PasswordStrength {
  if (!pass) {
    return { score: 0, label: "", color: "bg-slate-200", bgColor: "bg-slate-100", percent: 0 };
  }

  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score === 1) {
    return { score: 1, label: "Weak", color: "bg-red-500", bgColor: "bg-red-50 text-red-600 border-red-200", percent: 25 };
  }
  if (score === 2) {
    return { score: 2, label: "Fair", color: "bg-amber-500", bgColor: "bg-amber-50 text-amber-700 border-amber-200", percent: 50 };
  }
  if (score === 3) {
    return { score: 3, label: "Good", color: "bg-blue-500", bgColor: "bg-blue-50 text-blue-700 border-blue-200", percent: 75 };
  }
  if (score === 4) {
    return { score: 4, label: "Strong", color: "bg-emerald-500", bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200", percent: 100 };
  }
  return { score: 1, label: "Too short", color: "bg-red-400", bgColor: "bg-red-50 text-red-600 border-red-200", percent: 15 };
}

/** Auto-detect whether user is typing email or phone in login */
function detectIdentifierType(value: string): "empty" | "email" | "phone" {
  const trimmed = value.trim();
  if (!trimmed) return "empty";
  if (trimmed.includes("@") || /[a-zA-Z]/.test(trimmed)) {
    return "email";
  }
  if (/^[\d+\s\-().]+$/.test(trimmed)) {
    return "phone";
  }
  return "email";
}

export function AuthFlipCard({
  initialMode,
  redirect,
  initialPlan,
  initialBilling,
  initialOnboardingType,
}: AuthFlipCardProps) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  // Active state: "login" or "signup"
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const isSignup = mode === "signup";

  // Onboarding choice: 3-day trial vs direct plan purchase
  const [onboardingChoice, setOnboardingChoice] = useState<"trial" | "purchase">(
    initialOnboardingType || (initialPlan ? "purchase" : "trial")
  );
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan || "standard");
  const [selectedBilling, setSelectedBilling] = useState<string>(initialBilling || "yearly");

  // Measure natural heights so the card hugs its content snuggly with NO empty white space
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [frontHeight, setFrontHeight] = useState<number>(380);
  const [backHeight, setBackHeight] = useState<number>(510);

  useEffect(() => {
    let rafId: number | null = null;
    const measure = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (frontRef.current) {
          const fh = frontRef.current.offsetHeight || frontRef.current.scrollHeight;
          if (fh > 100) {
            setFrontHeight((prev) => (Math.abs(prev - fh) > 2 ? fh : prev));
          }
        }
        if (backRef.current) {
          const bh = backRef.current.offsetHeight || backRef.current.scrollHeight;
          if (bh > 100) {
            setBackHeight((prev) => (Math.abs(prev - bh) > 2 ? bh : prev));
          }
        }
      });
    };

    measure();
    const t1 = setTimeout(measure, 60);
    const t2 = setTimeout(measure, 250);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      if (frontRef.current) ro.observe(frontRef.current);
      if (backRef.current) ro.observe(backRef.current);
    }

    const onResize = () => measure();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Switch between login and signup smoothly
  const setCardMode = useCallback((target: "login" | "signup") => {
    setMode((prev) => {
      if (prev === target) return prev;
      if (typeof document !== "undefined") {
        document.title =
          target === "login"
            ? "Login | Occo Flow"
            : "Start Free Trial | Occo Flow";
      }
      return target;
    });
  }, []);

  // Country detection & selector state (defaults instantly via browser timezone)
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef<HTMLDivElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    if (!countryPickerOpen) return undefined;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryPickerRef.current &&
        !countryPickerRef.current.contains(e.target as Node)
      ) {
        setCountryPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [countryPickerOpen]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // ── Login State ─────────────────────────────────────────────────
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const identifierType = useMemo(
    () => detectIdentifierType(loginIdentifier),
    [loginIdentifier],
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmed = loginIdentifier.trim();
    if (!trimmed) {
      setLoginError("Please enter your email or phone number.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginLoading(true);
    let emailToUse = trimmed;

    if (identifierType === "phone") {
      const digitsOnly = trimmed.replace(/\D/g, "");
      const searchPattern = digitsOnly.length >= 7 ? digitsOnly.slice(-10) : digitsOnly;

      try {
        const { data: bizMatch } = await supabase
          .from("businesses")
          .select("email")
          .ilike("phone", `%${searchPattern}%`)
          .limit(1)
          .maybeSingle();

        if (bizMatch?.email) {
          emailToUse = bizMatch.email;
        } else {
          const { error: phoneErr } = await supabase.auth.signInWithPassword({
            phone: trimmed,
            password: loginPassword,
          });

          setLoginLoading(false);
          if (phoneErr) {
            setLoginError(
              "No account found matching this phone number. Please sign in with your email address.",
            );
            return;
          }

          navigate({
            to: redirect && redirect !== "/auth/login" ? (redirect as "/dashboard") : "/dashboard",
          });
          return;
        }
      } catch {
        // Fall back to direct email attempt
      }
    }

    const { error: err } = await signIn(emailToUse, loginPassword);
    setLoginLoading(false);

    if (err) {
      if (err.toLowerCase().includes("invalid login credentials")) {
        setLoginError("Incorrect email or password. Please try again.");
      } else if (err.toLowerCase().includes("email not confirmed")) {
        setLoginError("Please verify your email address. Check your inbox.");
      } else {
        setLoginError(err);
      }
      return;
    }

    navigate({
      to: redirect && redirect !== "/auth/login" ? (redirect as "/dashboard") : "/dashboard",
    });
  };

  // ── Signup State ────────────────────────────────────────────────
  const [signupFields, setSignupFields] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [signupTerms, setSignupTerms] = useState(true);
  const [signupShowPw, setSignupShowPw] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Password strength calculation for signup
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(signupFields.password),
    [signupFields.password]
  );

  const setSignupField = useCallback(
    (k: keyof typeof signupFields) => (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const val = e.target.value;
      setSignupFields((prev) => (prev[k] === val ? prev : { ...prev, [k]: val }));
      setFieldErrors((prev) => {
        if (!prev[k]) return prev;
        const next = { ...prev };
        delete next[k];
        return next;
      });
    },
    [],
  );

  const validateSignup = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!signupFields.fullName.trim()) errs.fullName = "Required";
    if (!signupFields.businessName.trim()) errs.businessName = "Required";
    if (!signupFields.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errs.email = "Valid email required";
    }
    if (signupFields.password.length < 8) {
      errs.password = "Min. 8 characters required";
    }
    if (signupFields.password !== signupFields.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (!signupTerms) {
      errs.terms = "Please accept terms";
    }
    return errs;
  };

  const [signupIntent, setSignupIntent] = useState<"trial" | "subscribe">("trial");

  const handleSignupWithChoice = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent,
    intent: "trial" | "subscribe"
  ) => {
    e.preventDefault();
    setSignupIntent(intent);
    const errs = validateSignup();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSignupError(null);
    setSignupLoading(true);

    // Combine country code with phone if provided
    const formattedPhone = signupFields.phone.trim()
      ? `${selectedCountry.dialCode} ${signupFields.phone.trim().replace(/^0+/, "")}`
      : "";

    const { error: err } = await signUp({
      email: signupFields.email.trim(),
      password: signupFields.password,
      fullName: signupFields.fullName.trim(),
      businessName: signupFields.businessName.trim(),
      phone: formattedPhone,
    });

    setSignupLoading(false);
    if (err) {
      setSignupError(err);
      return;
    }
    if (intent === "subscribe") {
      navigate({ to: "/subscription" });
    } else {
      navigate({ to: redirect || "/dashboard" });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSignupWithChoice(e, signupIntent);
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center pt-8 sm:pt-12 pb-12 bg-gradient-to-br from-[#f8fafc] via-white to-[#eff6ff]/35 px-4 font-sans text-[#0f172a]">
      {/* ── Stable Brand Header (Stays 100% Static) ── */}
      <div className="mb-3.5 text-center shrink-0">
        <Link
          to="/landing"
          className="inline-flex items-center gap-2.5 no-underline hover:opacity-90 transition-opacity"
        >
          <img
            src="/logo.png"
            alt={BRAND}
            width={36}
            height={36}
            loading="eager"
            decoding="async"
            className="size-9 rounded-xl object-contain shadow-xs"
          />
          <div className="text-left">
            <span className="font-display text-lg font-extrabold tracking-tight text-[#0f172a] block leading-none">
              {BRAND}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight mt-0.5">
              Simple CRM for Business Owners
            </span>
          </div>
        </Link>
      </div>

      {/* ── Fixed Top Toggle: [ LOGIN ]  [ SIGN UP ] (Stays 100% Static) ── */}
      <div className="mb-3.5 shrink-0">
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="inline-flex items-center rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-xs"
        >
          <button
            type="button"
            role="tab"
            id="tab-login"
            aria-controls="panel-login"
            aria-selected={!isSignup}
            onClick={() => setCardMode("login")}
            className={`relative rounded-lg px-6 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              !isSignup
                ? "bg-white text-[#2563eb] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            role="tab"
            id="tab-signup"
            aria-controls="panel-signup"
            aria-selected={isSignup}
            onClick={() => setCardMode("signup")}
            className={`relative rounded-lg px-6 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              isSignup
                ? "bg-white text-[#2563eb] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            SIGN UP
          </button>
        </div>
      </div>

      {/* ── 3D Card Flip Perspective Container (ONLY this card flips in 3D right/left) ── */}
      <div
        className="w-full max-w-[490px] relative mx-auto auth-perspective mt-2"
      >
        <motion.div
          className="relative w-full"
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            willChange: "transform, height",
          }}
          initial={false}
          animate={{
            rotateY: isSignup ? 180 : 0,
            height: isSignup ? backHeight : frontHeight,
          }}
          transition={{
            rotateY: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
            height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          {/* ══════════════════════════════════════════════════════════
              FRONT FACE: LOGIN CARD (0deg)
          ══════════════════════════════════════════════════════════ */}
          <motion.div
            ref={frontRef}
            role="tabpanel"
            id="panel-login"
            aria-labelledby="tab-login"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
              WebkitTransform: "rotateY(0deg)",
              willChange: "transform, opacity",
            }}
            initial={false}
            animate={{
              opacity: isSignup ? 0 : 1,
              zIndex: isSignup ? 0 : 20,
              pointerEvents: isSignup ? "none" : "auto",
            }}
            transition={{
              opacity: { duration: 0.08, delay: 0.24 },
              zIndex: { delay: 0.26 },
            }}
            aria-hidden={isSignup}
            className="absolute inset-x-0 top-0 w-full rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)]"
          >
              {/* Login Header */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-xl font-bold text-[#0f172a]">
                    Welcome back
                  </h1>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#2563eb] border border-blue-200">
                    Workspace Login
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Sign in to manage your pipeline, leads, and customer deals
                </p>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="mb-3 rounded-xl border border-red-100 bg-red-50/90 px-3.5 py-2 text-xs font-medium text-red-700"
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                {/* Email or Phone field — NO placeholder */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="login-identifier"
                      className="block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Email or Phone
                    </label>
                    {identifierType === "email" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">
                        <Mail size={11} /> Email detected
                      </span>
                    )}
                    {identifierType === "phone" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 border border-purple-200">
                        <Phone size={11} /> Phone detected
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    {identifierType === "phone" ? (
                      <Phone
                        size={15}
                        className="pointer-events-none absolute left-3 top-3 text-purple-500"
                      />
                    ) : identifierType === "email" ? (
                      <Mail
                        size={15}
                        className="pointer-events-none absolute left-3 top-3 text-blue-500"
                      />
                    ) : (
                      <AtSign
                        size={15}
                        className="pointer-events-none absolute left-3 top-3 text-slate-400"
                      />
                    )}
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Password field — NO placeholder */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Password
                    </label>
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs font-semibold text-[#2563eb] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="pointer-events-none absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      id="login-password"
                      type={loginShowPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-9 text-xs sm:text-sm text-[#0f172a] focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPw((v) => !v)}
                      className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      tabIndex={-1}
                      aria-label={loginShowPw ? "Hide password" : "Show password"}
                    >
                      {loginShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px] text-slate-500">
                  Active 3-day trial workspaces can sign in here directly anytime.
                </div>

                {/* Submit CTA directly in flow */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loginLoading}
                  className="mt-1 h-10.5 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white shadow-xs transition-all hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 cursor-pointer flex items-center justify-center"
                >
                  {loginLoading ? "Signing in…" : "Sign In to CRM"}
                </button>

                {/* Visible flip prompt back to Sign Up */}
                <div className="pt-1 text-center text-xs text-slate-500">
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => setCardMode("signup")}
                    className="font-bold text-[#2563eb] hover:underline cursor-pointer"
                  >
                    Start 3-Day Free Trial
                  </button>
                </div>

                <div className="pt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Encrypted session • Secure cloud storage</span>
                </div>
              </form>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════
              BACK FACE: SIGNUP CARD (180deg)
          ══════════════════════════════════════════════════════════ */}
          <motion.div
            ref={backRef}
            role="tabpanel"
            id="panel-signup"
            aria-labelledby="tab-signup"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              WebkitTransform: "rotateY(180deg)",
              willChange: "transform, opacity",
            }}
            initial={false}
            animate={{
              opacity: isSignup ? 1 : 0,
              zIndex: isSignup ? 20 : 0,
              pointerEvents: isSignup ? "auto" : "none",
            }}
            transition={{
              opacity: { duration: 0.08, delay: 0.24 },
              zIndex: { delay: 0.26 },
            }}
            aria-hidden={!isSignup}
            className="absolute inset-x-0 top-0 w-full rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)]"
          >
              {/* Signup Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-xl font-bold text-[#0f172a]">
                    Start Free Trial
                  </h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    3 Days Free
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Instant access to all CRM features • No credit card needed
                </p>
              </div>

              {signupError && (
                <div
                  role="alert"
                  className="mb-2.5 rounded-xl border border-red-100 bg-red-50/90 px-3 py-1.5 text-xs font-medium text-red-700"
                >
                  {signupError}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-2.5">
                {/* Row 1: Full Name & Business Name — NO placeholders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="signup-fullName"
                      className="mb-1 block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={15}
                        className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                      />
                      <input
                        id="signup-fullName"
                        type="text"
                        required
                        value={signupFields.fullName}
                        onChange={setSignupField("fullName")}
                        className={`h-9.5 w-full rounded-xl border bg-slate-50/70 pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                          fieldErrors.fullName
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-[#2563eb] focus:ring-blue-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.fullName && (
                      <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-businessName"
                      className="mb-1 block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Business Name
                    </label>
                    <div className="relative">
                      <Building2
                        size={15}
                        className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                      />
                      <input
                        id="signup-businessName"
                        type="text"
                        required
                        value={signupFields.businessName}
                        onChange={setSignupField("businessName")}
                        className={`h-9.5 w-full rounded-xl border bg-slate-50/70 pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                          fieldErrors.businessName
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-[#2563eb] focus:ring-blue-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.businessName && (
                      <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.businessName}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email & Phone with Country Code & Flag — NO placeholders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="mb-1 block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                      />
                      <input
                        id="signup-email"
                        type="email"
                        required
                        value={signupFields.email}
                        onChange={setSignupField("email")}
                        className={`h-9.5 w-full rounded-xl border bg-slate-50/70 pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                          fieldErrors.email
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-[#2563eb] focus:ring-blue-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Phone Input with Country Code and Flag Dropdown */}
                  <div ref={countryPickerRef} className="relative">
                    <label
                      htmlFor="signup-phone"
                      className="mb-1 block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Phone <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50/70 focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-colors overflow-visible">
                      {/* Country Code & Flag Trigger */}
                      <button
                        type="button"
                        onClick={() => setCountryPickerOpen((v) => !v)}
                        aria-label="Select Country Code"
                        aria-expanded={countryPickerOpen}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-l-xl border-r border-slate-200 shrink-0 cursor-pointer transition-colors"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className="text-slate-600">{selectedCountry.dialCode}</span>
                        <ChevronDown size={12} className="text-slate-400" />
                      </button>

                      {/* Phone Number Field — NO placeholder */}
                      <input
                        id="signup-phone"
                        type="tel"
                        value={signupFields.phone}
                        onChange={setSignupField("phone")}
                        className="h-9.5 w-full bg-transparent px-2.5 text-xs sm:text-sm text-[#0f172a] focus:outline-none"
                      />
                    </div>

                    {/* Country Selector Dropdown Menu */}
                    <AnimatePresence>
                      {countryPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-1.5 w-64 max-h-56 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden flex flex-col"
                        >
                          {/* Search Country Input */}
                          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                            <div className="relative">
                              <Search size={13} className="pointer-events-none absolute left-2.5 top-2 text-slate-400" />
                              <input
                                type="text"
                                autoFocus
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country or code..."
                                className="h-7.5 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-xs text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb]"
                              />
                            </div>
                          </div>

                          {/* Country List */}
                          <div className="overflow-y-auto max-h-44 p-1 divide-y divide-slate-50 text-xs">
                            {filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setCountryPickerOpen(false);
                                  setCountrySearch("");
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer hover:bg-blue-50 ${
                                  selectedCountry.code === c.code ? "bg-blue-50/80 font-bold text-[#2563eb]" : "text-slate-700"
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span className="text-sm">{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </span>
                                <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                                  {c.dialCode}
                                </span>
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No country found
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Row 3: Password & Confirm Password — NO placeholders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="mb-1 block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                      />
                      <input
                        id="signup-password"
                        type={signupShowPw ? "text" : "password"}
                        required
                        value={signupFields.password}
                        onChange={setSignupField("password")}
                        className={`h-9.5 w-full rounded-xl border bg-slate-50/70 pl-9 pr-8 text-xs sm:text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                          fieldErrors.password
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-[#2563eb] focus:ring-blue-100"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setSignupShowPw((v) => !v)}
                        className="absolute right-2.5 top-2 rounded p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                        aria-label={signupShowPw ? "Hide password" : "Show password"}
                      >
                        {signupShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.password}</p>
                    )}

                    {/* Compact Password Strength directly under password field */}
                    {signupFields.password.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Strength</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] border ${passwordStrength.bgColor}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1 w-full">
                          {[1, 2, 3, 4].map((step) => {
                            const isActive = passwordStrength.score >= step;
                            return (
                              <div key={step} className="h-full rounded-full bg-slate-200 overflow-hidden">
                                <motion.div
                                  initial={false}
                                  animate={{ width: isActive ? "100%" : "0%" }}
                                  transition={{ duration: 0.25 }}
                                  className={`h-full ${passwordStrength.color}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-confirmPassword"
                      className="mb-1 block text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                      />
                      <input
                        id="signup-confirmPassword"
                        type={signupShowPw ? "text" : "password"}
                        required
                        value={signupFields.confirmPassword}
                        onChange={setSignupField("confirmPassword")}
                        className={`h-9.5 w-full rounded-xl border bg-slate-50/70 pl-9 pr-3 text-xs sm:text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                          fieldErrors.confirmPassword
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-[#2563eb] focus:ring-blue-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.confirmPassword}</p>
                    )}

                    {/* Confirm Password match indicator directly under confirm password field */}
                    {signupFields.confirmPassword.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                        {signupFields.password === signupFields.confirmPassword ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <Check size={12} className="stroke-[2.5]" /> Passwords match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <XCircle size={12} className="stroke-[2.5]" /> Passwords do not match
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signupTerms}
                      onChange={(e) => setSignupTerms(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-[#2563eb] focus:ring-blue-400 cursor-pointer"
                    />
                    <span>
                      I agree to the{" "}
                      <span className="font-semibold text-slate-800 underline">Terms</span> &amp;{" "}
                      <span className="font-semibold text-slate-800 underline">Privacy Policy</span>
                    </span>
                  </label>
                  {fieldErrors.terms && (
                    <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.terms}</p>
                  )}
                </div>

                {/* Split Action Buttons: 1st "Take 3-Day Free Trial" and 2nd "Subscribe Now" */}
                <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="signup-trial-btn"
                    onClick={(e) => handleSignupWithChoice(e, "trial")}
                    disabled={signupLoading}
                    className="h-11 w-full rounded-xl bg-[#2563eb] text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 cursor-pointer flex items-center justify-center text-center px-3"
                  >
                    {signupLoading && signupIntent === "trial"
                      ? "Starting Trial…"
                      : "Take 3-Day Free Trial"}
                  </button>

                  <button
                    type="button"
                    id="signup-subscribe-btn"
                    onClick={(e) => handleSignupWithChoice(e, "subscribe")}
                    disabled={signupLoading}
                    className="h-11 w-full rounded-xl border-2 border-slate-900 bg-slate-900 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60 cursor-pointer flex items-center justify-center text-center px-3"
                  >
                    {signupLoading && signupIntent === "subscribe"
                      ? "Redirecting…"
                      : "Subscribe Now"}
                  </button>
                </div>

                {/* Visible flip prompt back to Login */}
                <div className="pt-1 text-center text-xs text-slate-500">
                  Already have a workspace?{" "}
                  <button
                    type="button"
                    onClick={() => setCardMode("login")}
                    className="font-bold text-[#2563eb] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>

                <div className="pt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Full access • Automatic 3-day trial • No lock-in</span>
                </div>
              </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
