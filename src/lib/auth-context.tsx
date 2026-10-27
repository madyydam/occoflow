import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  authService,
  profileService,
  businessService,
  subscriptionService,
} from "./supabase";
import type { Profile, Business, Subscription, AccessState } from "./crm-data";
import { isAccessAllowed } from "./crm-data";

// ── Types ─────────────────────────────────────────────────────────
interface AuthStore {
  // State
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  business: Business | null;
  subscription: Subscription | null;
  accessState: AccessState;
  isLoading: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (args: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    phone: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;

  // Profile / business refresh
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateBusiness: (patch: Partial<Business>) => Promise<boolean>;
  updateProfile: (patch: Partial<Profile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthStore | null>(null);

export function useAuth(): AuthStore {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Compute access state ────────────────────────────────────────
  const accessState: AccessState = (() => {
    if (isLoading) return "loading";
    if (!session) return "unauthenticated";
    if (!subscription) return "trial_active";
    if (subscription.status === "trial_active") return "trial_active";
    if (subscription.status === "subscribed") return "subscribed";
    if (subscription.status === "trial_expired") return "trial_expired";
    if (
      subscription.status === "subscription_expired" ||
      subscription.status === "subscription_cancelled"
    )
      return "sub_expired";
    return "trial_active";
  })();

  // ── Load profile + business + subscription ──────────────────────
  const loadUserData = useCallback(async (usr: User) => {
    try {
      const prof = await profileService.get(usr.id);
      setProfile(prof);

      let bizId = prof?.businessId;
      if (!bizId) {
        const { data: memberRows } = await supabase
          .from("memberships")
          .select("business_id")
          .eq("user_id", usr.id)
          .limit(1);

        if (memberRows && memberRows.length > 0 && memberRows[0]) {
          const rawBizId = (memberRows[0] as Record<string, unknown>)["business_id"];
          if (typeof rawBizId === "string" && rawBizId) {
            bizId = rawBizId;
            await profileService.update(usr.id, { businessId: bizId });
          }
        }
      }

      // Auto-heal: If user has no business, provision one automatically via /api/auth/provision
      if (!bizId) {
        try {
          const healRes = await fetch("/api/auth/provision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: usr.id,
              businessName: `${prof?.fullName || usr.user_metadata?.["full_name"] || "My"} Workspace`,
              fullName: prof?.fullName || usr.user_metadata?.["full_name"] || "Business Owner",
              phone: prof?.phone || usr.user_metadata?.["phone"] || "",
            }),
          });
          const healData = await healRes.json();
          if (healData.success && healData.business) {
            bizId = healData.business.id;
            setBusiness(healData.business);
            setSubscription(healData.subscription);
            const updatedProf = await profileService.get(usr.id);
            setProfile(updatedProf);
          }
        } catch (e) {
          console.warn("[AuthContext] Auto-heal provision failed:", e);
        }
      }

      if (bizId) {
        const [biz, sub] = await Promise.all([
          businessService.get(bizId),
          subscriptionService.get(bizId),
        ]);
        if (biz) setBusiness(biz);
        if (sub) setSubscription(sub);
      }
    } catch (e) {
      console.error("[AuthContext] Error loading user data:", e);
    }
  }, []);

  // ── Auth state listener ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadUserData(data.session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const { data: listener } = authService.onAuthStateChange(async (event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setBusiness(null);
        setSubscription(null);
        setIsLoading(false);
      } else if (sess?.user) {
        setIsLoading(true);
        loadUserData(sess.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  // ── Actions ─────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    return { error: error?.message ?? null };
  };

  const signUp = async ({
    email,
    password,
    fullName,
    businessName,
    phone,
  }: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    phone: string;
  }) => {
    // 1. Create auth user
    const { data: authData, error: authError } = await authService.signUp(
      email,
      password,
      fullName,
      phone,
    );
    if (authError || !authData.user) {
      return { error: authError?.message ?? "Signup failed" };
    }
    const userId = authData.user.id;

    // 2. Provision workspace via server API (bypasses RLS chicken-and-egg deadlock)
    try {
      const provRes = await fetch("/api/auth/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          businessName,
          fullName,
          phone,
        }),
      });
      const provData = await provRes.json();
      if (provData.business) {
        setBusiness(provData.business);
      }
      if (provData.subscription) {
        setSubscription(provData.subscription);
      }
    } catch (e) {
      console.warn("[AuthContext] Provision API call failed, falling back to direct creation:", e);
      // Fallback
      const biz = await businessService.create(businessName, "General");
      if (biz) {
        await businessService.addMember(userId, biz.id, "owner");
        await profileService.update(userId, { businessId: biz.id, fullName, phone });
        await subscriptionService.create(biz.id);
      }
    }

    // Immediately reload user data so that state is fully hydrated
    await loadUserData(authData.user);

    return { error: null };
  };

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await authService.sendOtp(email);
    return { error: error?.message ?? null };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await authService.verifyOtp(email, token);
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await authService.updatePassword(password);
    return { error: error?.message ?? null };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadUserData(user);
  }, [user, loadUserData]);

  const refreshSubscription = useCallback(async () => {
    if (!business) return;
    const sub = await subscriptionService.get(business.id);
    setSubscription(sub);
  }, [business]);

  const updateBusiness = useCallback(async (patch: Partial<Business>) => {
    if (!business) return false;
    const ok = await businessService.update(business.id, patch);
    if (ok) setBusiness((prev) => (prev ? { ...prev, ...patch } : prev));
    return ok;
  }, [business]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!user) return false;
    const cleanPatch: { fullName?: string; phone?: string; avatarUrl?: string } = {};
    if (patch.fullName !== undefined) cleanPatch.fullName = patch.fullName;
    if (patch.phone !== undefined) cleanPatch.phone = patch.phone;
    if (patch.avatarUrl !== undefined) cleanPatch.avatarUrl = patch.avatarUrl;
    const ok = await profileService.update(user.id, cleanPatch);
    if (ok) setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    return ok;
  }, [user]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      business,
      subscription,
      accessState,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      verifyOtp,
      updatePassword,
      refreshProfile,
      refreshSubscription,
      updateBusiness,
      updateProfile,
    }),
    [
      session,
      user,
      profile,
      business,
      subscription,
      accessState,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      verifyOtp,
      updatePassword,
      refreshProfile,
      refreshSubscription,
      updateBusiness,
      updateProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
export { isAccessAllowed };
