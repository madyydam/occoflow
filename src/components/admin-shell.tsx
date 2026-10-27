import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LayoutGrid,
  BadgeDollarSign,
  BarChart3,
  Bell,
  HeadphonesIcon,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquarePlus,
  Activity,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAdminAuth } from "@/lib/admin-context";
import { BRAND } from "@/lib/crm-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";

// ── Nav groups ────────────────────────────────────────────────────
const navGroups: {
  label: string;
  items: { label: string; to: string; icon: LucideIcon }[];
}[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Customers",
    items: [{ label: "Users", to: "/admin/users", icon: Users }],
  },
  {
    label: "Revenue",
    items: [
      { label: "Subscriptions", to: "/admin/subscriptions", icon: CreditCard },
      { label: "Plans", to: "/admin/plans", icon: LayoutGrid },
      { label: "Payments", to: "/admin/payments", icon: BadgeDollarSign },
      { label: "Revenue", to: "/admin/revenue", icon: BarChart3 },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
      { label: "System Operations", to: "/admin/system-operations", icon: Activity },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
      { label: "Problems & Suggestions", to: "/admin/support", icon: MessageSquarePlus },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: ScrollText },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname.startsWith(to);
}

// ── Light Theme Sidebar ───────────────────────────────────────────
function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { adminUser, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex h-full w-[250px] flex-col border-r border-slate-200 bg-white font-sans text-slate-800">
      {/* Brand */}
      <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link to="/admin" className="flex items-center gap-2.5 no-underline" onClick={onClose}>
          <img src="/logo.png" alt={BRAND} className="size-7 rounded-lg object-contain shadow-xs" />
          <div>
            <p className="text-[13px] font-extrabold text-[#0f172a] leading-tight">{BRAND}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#2563eb] leading-tight">
              Admin Portal
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ label, to, icon: Icon }) => {
                const active = isActive(pathname, to);
                return (
                  <Link
                    key={to}
                    to={to as "/admin"}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all no-underline ${
                      active
                        ? "bg-blue-50 text-[#2563eb] font-bold shadow-xs ring-1 ring-blue-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? "text-[#2563eb]" : "text-slate-400"}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom bar with icon-only actions */}
      <div className="shrink-0 border-t border-slate-100 p-2 flex items-center justify-between">
        <Link
          to="/admin/custom-software"
          title="Custom Software Inquiries"
          onClick={onClose}
          className={`flex size-7 items-center justify-center rounded-md transition-all cursor-pointer ${
            isActive(pathname, "/admin/custom-software")
              ? "bg-blue-50 text-[#2563eb] ring-1 ring-blue-200"
              : "text-slate-400 hover:bg-blue-50 hover:text-[#2563eb]"
          }`}
          aria-label="Custom Software Inquiries"
        >
          <Code2 size={14} />
        </Link>

        <button
          onClick={handleLogout}
          title="Sign Out of Admin"
          className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
          aria-label="Sign Out of Admin"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Admin Shell ───────────────────────────────────────────────────
export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useLocation({ select: (l) => l.pathname });

  // Page title from pathname
  const pageTitle =
    pathname === "/admin" || pathname === "/admin/"
      ? "Dashboard"
      : pathname.startsWith("/admin/businesses")
        ? "Businesses"
        : pathname.startsWith("/admin/custom-software")
          ? "Custom Software Inquiries"
          : pathname.startsWith("/admin/users")
            ? "Users"
            : pathname.startsWith("/admin/trials")
              ? "Trial Management"
              : pathname.startsWith("/admin/subscriptions")
                ? "Subscriptions"
                : pathname.startsWith("/admin/plans")
                  ? "Plans & Pricing"
                  : pathname.startsWith("/admin/payments")
                    ? "Payments"
                    : pathname.startsWith("/admin/revenue")
                      ? "Revenue"
                      : pathname.startsWith("/admin/system-operations")
                        ? "System Operations"
                        : pathname.startsWith("/admin/analytics")
                          ? "Analytics"
                          : pathname.startsWith("/admin/notifications")
                            ? "Notifications"
                            : pathname.startsWith("/admin/support")
                              ? "Problems & Suggestions"
                              : pathname.startsWith("/admin/audit-logs")
                                ? "Audit Logs"
                                : pathname.startsWith("/admin/settings")
                                  ? "Settings"
                                  : "Admin Panel";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Height 50px, Page Name only on left, Date only on right */}
        <header className="flex h-[50px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <h1 className="font-display text-base font-bold text-[#0f172a] leading-none">
              {pageTitle}
            </h1>
          </div>

          <p className="text-xs font-semibold text-slate-500">{today}</p>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">{children}</main>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

// ── Shared Admin UI Components ────────────────────────────────────
export function AdminKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string | undefined;
  icon: LucideIcon;
  tone: string;
  trend?: string | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-slate-300">
      <div className="flex items-center justify-between">
        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mr-2">{label}</p>
        <div
          className={`grid size-7 sm:size-8 shrink-0 place-items-center rounded-lg text-xs ${tone}`}
        >
          <Icon size={15} />
        </div>
      </div>
      <p className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold leading-none text-[#0f172a]">
        {value}
      </p>
      {trend && (
        <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-emerald-600">{trend}</p>
      )}
      {sub && <p className="mt-1 text-[10px] sm:text-[11px] text-slate-400 truncate">{sub}</p>}
    </div>
  );
}

export function AdminPageHeader({
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  if (!action) return null;
  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function AdminBadge({
  label,
  color,
}: {
  label: string;
  color: "blue" | "green" | "red" | "amber" | "slate" | "violet" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    violet: "bg-purple-50 text-purple-700 ring-purple-200",
    orange: "bg-orange-50 text-orange-800 ring-orange-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${colors[color]}`}
    >
      {label}
    </span>
  );
}

export function statusColor(
  status: string,
): "blue" | "green" | "red" | "amber" | "slate" | "violet" | "orange" {
  if (!status) return "slate";
  const s = status.toLowerCase();
  if (s.includes("active") || s.includes("subscribed") || s === "resolved" || s === "closed")
    return "green";
  if (s.includes("expired") || s.includes("cancelled") || s === "failed" || s === "suspended")
    return "red";
  if (s.includes("trial")) return "blue";
  if (s === "pending" || s === "in_progress" || s === "waiting") return "amber";
  if (s === "draft") return "slate";
  if (s === "scheduled") return "violet";
  if (s === "ending_soon") return "orange";
  return "slate";
}

export function AdminEmptyState({
  title,
  description,

  icon: _Icon,
}: {
  title: string;
  description?: string;
  // accept any Lucide icon component (or any React component type)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-xl bg-slate-100 text-slate-400">
        {_Icon ? <_Icon size={26} /> : <LayoutDashboard size={26} />}
      </div>
      <h3 className="text-base font-bold text-[#0f172a]">{title}</h3>
      {description && <p className="mt-2 max-w-xs text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function AdminLoadingRows({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3.5 rounded bg-slate-100"
                style={{ width: `${60 + ((j * 10) % 30)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-slate-500 -mt-2">{description}</p>}
        {children}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white cursor-pointer ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-[#2563eb] hover:bg-[#1d4ed8]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
