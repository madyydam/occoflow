import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode,
} from "react";
import { supabase } from "./supabase";
import { adminAuthService, type AdminUser } from "./admin-service";

// ── Types ──────────────────────────────────────────────────────────
type AdminAccessState = "loading" | "unauthenticated" | "not_admin" | "authorized";

interface AdminStore {
  adminUser: AdminUser | null;
  accessState: AdminAccessState;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminStore | null>(null);

export function useAdminAuth(): AdminStore {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────
export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [accessState, setAccessState] = useState<AdminAccessState>("loading");

  const checkAdmin = useCallback(async (userId: string) => {
    try {
      const admin = await adminAuthService.getAdminUser(userId);
      if (admin && admin.isActive) {
        setAdminUser(admin);
        setAccessState("authorized");
        // Touch last_login
        await adminAuthService.touchLogin(userId);
      } else {
        setAdminUser(null);
        setAccessState("not_admin");
      }
    } catch {
      setAdminUser(null);
      setAccessState("not_admin");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Clean up any legacy demo keys
    if (typeof window !== "undefined") {
      localStorage.removeItem("occo_admin_demo");
      localStorage.removeItem("futora_admin_demo");
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        checkAdmin(data.session.user.id);
      } else {
        setAccessState("unauthenticated");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session) {
        setAdminUser(null);
        setAccessState("unauthenticated");
      } else if (session.user) {
        await checkAdmin(session.user.id);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAccessState("loading");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setAccessState("unauthenticated");
      return { error: error?.message ?? "Invalid admin credentials." };
    }

    // Verify admin privileges strictly in admin_users table
    const admin = await adminAuthService.getAdminUser(data.user.id);
    if (!admin || !admin.isActive) {
      // User is not an admin, sign out immediately
      await supabase.auth.signOut();
      setAdminUser(null);
      setAccessState("not_admin");
      return { error: "Access Denied: This account does not have administrator privileges." };
    }

    setAdminUser(admin);
    setAccessState("authorized");
    await adminAuthService.touchLogin(admin.id);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("occo_admin_demo");
      localStorage.removeItem("futora_admin_demo");
    }
    await supabase.auth.signOut();
    setAdminUser(null);
    setAccessState("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await checkAdmin(data.session.user.id);
    } else {
      setAccessState("unauthenticated");
    }
  }, [checkAdmin]);

  const value = useMemo(
    () => ({ adminUser, accessState, signIn, signOut, refresh }),
    [adminUser, accessState, signIn, signOut, refresh]
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
