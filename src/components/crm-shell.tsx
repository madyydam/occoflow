import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UsersRound,
  ContactRound,
  Handshake,
  ListTodo,
  CalendarDays,
  ChartNoAxesCombined,
  Settings2,
  Grid2X2,
  Bell,
  Search,
  Plus,
  ChevronDown,
  UserRound,
  LogOut,
  MessageSquarePlus,
  IndianRupee,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { BRAND, initials } from "@/lib/crm-data";
import { useCRM } from "@/lib/crm-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { QuickForm } from "./crm-ui";
import { TrialBanner } from "./access-guard";
import { BroadcastAnnouncementModal } from "./broadcast-modal";
import { OccoRobotAssistant } from "./occo-robot-bot";

const desktopNav = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-100/80 text-blue-600",
    activeContainer: "bg-blue-50/90 text-blue-700 border-blue-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-blue-600 text-white shadow-xs",
  },
  {
    label: "Leads",
    to: "/leads",
    icon: UsersRound,
    iconColor: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-100/80 text-sky-600",
    activeContainer: "bg-sky-50/90 text-sky-700 border-sky-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-sky-600 text-white shadow-xs",
  },
  {
    label: "Contacts",
    to: "/contacts",
    icon: ContactRound,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100/80 text-emerald-600",
    activeContainer: "bg-emerald-50/90 text-emerald-700 border-emerald-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-emerald-600 text-white shadow-xs",
  },
  {
    label: "Deals",
    to: "/deals",
    icon: Handshake,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100/80 text-amber-600",
    activeContainer: "bg-amber-50/90 text-amber-700 border-amber-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-amber-600 text-white shadow-xs",
  },
  {
    label: "Payment Dues",
    to: "/payments",
    icon: IndianRupee,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100/80 text-emerald-600",
    activeContainer: "bg-emerald-50/90 text-emerald-700 border-emerald-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-emerald-600 text-white shadow-xs",
  },
  {
    label: "Tasks",
    to: "/tasks",
    icon: ListTodo,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-100/80 text-purple-600",
    activeContainer: "bg-purple-50/90 text-purple-700 border-purple-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-purple-600 text-white shadow-xs",
  },
  {
    label: "Team",
    to: "/team",
    icon: Users,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-100/80 text-indigo-600",
    activeContainer: "bg-indigo-50/90 text-indigo-700 border-indigo-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-indigo-600 text-white shadow-xs",
  },
  {
    label: "Calendar",
    to: "/calendar",
    icon: CalendarDays,
    iconColor: "text-pink-600",
    bgColor: "bg-pink-50 border-pink-100/80 text-pink-600",
    activeContainer: "bg-pink-50/90 text-pink-700 border-pink-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-pink-600 text-white shadow-xs",
  },
  {
    label: "Analytics",
    to: "/analytics",
    icon: ChartNoAxesCombined,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-100/80 text-indigo-600",
    activeContainer: "bg-indigo-50/90 text-indigo-700 border-indigo-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-indigo-600 text-white shadow-xs",
  },
  {
    label: "Problems & Suggestions",
    to: "/feedback",
    icon: MessageSquarePlus,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-100/80 text-orange-600",
    activeContainer: "bg-orange-50/90 text-orange-700 border-orange-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-orange-600 text-white shadow-xs",
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings2,
    iconColor: "text-teal-600",
    bgColor: "bg-teal-50 border-teal-100/80 text-teal-600",
    activeContainer: "bg-teal-50/90 text-teal-700 border-teal-200/90 shadow-2xs font-bold",
    activeIconBg: "bg-teal-600 text-white shadow-xs",
  },
];
const mobileNav: {
  label: string;
  to: "/dashboard" | "/leads" | "/deals" | "/tasks" | "/more";
  icon: LucideIcon;
}[] = [
  { label: "Home", to: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", to: "/leads", icon: UsersRound },
  { label: "Deals", to: "/deals", icon: Handshake },
  { label: "Tasks", to: "/tasks", icon: ListTodo },
  { label: "More", to: "/more", icon: Grid2X2 },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 no-underline text-foreground">
      <img
        src="/logo.png"
        alt="Occo Flow"
        className="size-8 shrink-0 rounded-[9px] object-contain shadow-2xs"
      />
      {!compact && (
        <span className="font-display text-[15px] font-extrabold tracking-tight">{BRAND}</span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<"lead" | "deal" | "task" | "contact" | null>(null);
  const { leads, contacts, deals, tasks } = useCRM();
  const { profile, business, subscription, signOut } = useAuth();

  const userName = profile?.fullName || "User";
  const businessName = business?.name || "My Business";
  const userInitials = initials(userName);
  const subStatus = subscription?.status ?? "trial_active";
  const planLabel =
    subStatus === "subscribed" ? "Active" : subStatus === "trial_active" ? "Free Trial" : "Expired";

  const section = pathname.startsWith("/leads")
    ? "Leads"
    : pathname.startsWith("/deals")
      ? "Deals"
      : pathname.startsWith("/payments")
        ? "Payment Reminders"
        : pathname.startsWith("/team")
          ? "Team & Delegation"
          : pathname.startsWith("/tasks")
            ? "Tasks"
            : pathname.startsWith("/contacts")
              ? "Contacts"
              : pathname.startsWith("/calendar")
                ? "Calendar"
                : pathname.startsWith("/analytics")
                  ? "Analytics"
                  : pathname.startsWith("/feedback")
                    ? "Problems & Suggestions"
                    : pathname.startsWith("/settings")
                      ? "Settings"
                      : pathname.startsWith("/more")
                        ? "More"
                        : "Dashboard";

  const action =
    section === "Leads"
      ? "lead"
      : section === "Deals"
        ? "deal"
        : section === "Tasks"
          ? "task"
          : section === "Contacts"
            ? "contact"
            : "lead";

  const results = [
    ...leads
      .filter((x) =>
        `${x.name} ${x.company} ${x.phone}`.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 4)
      .map((x) => ({
        label: x.name,
        detail: `Lead · ${x.company}`,
        to: "/leads/$leadId" as const,
        params: { leadId: x.id },
      })),
    ...contacts
      .filter((x) => `${x.name} ${x.company}`.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map((x) => ({
        label: x.name,
        detail: `Contact · ${x.company}`,
        to: "/contacts" as const,
        params: undefined,
      })),
    ...deals
      .filter((x) => x.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map((x) => ({
        label: x.title,
        detail: `Deal · ${x.customer}`,
        to: "/deals" as const,
        params: undefined,
      })),
    ...tasks
      .filter((x) => x.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map((x) => ({ label: x.title, detail: `Task`, to: "/tasks" as const, params: undefined })),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="min-h-screen bg-background font-sans text-[13px]">
      {/* Sidebar (Generous 236px width, prominent items, colorful icons, rounded selection, hover animations) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex">
        <div className="px-2.5">
          <Brand />
        </div>
        <div className="mt-7 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
          Workspace
        </div>
        <nav className="mt-2.5 flex flex-col gap-1.5" aria-label="Main navigation">
          {desktopNav.map(({ label, to, icon: Icon, bgColor, activeContainer, activeIconBg }) => {
            const isActive =
              pathname === to || (to !== "/dashboard" && pathname.startsWith(to + "/"));
            return (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `${activeContainer} border`
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:translate-x-1"
                }`}
              >
                <div
                  className={`grid size-8.5 shrink-0 place-items-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? activeIconBg : bgColor
                  }`}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <span className="truncate">{label}</span>
                {isActive && <span className="ml-auto size-2 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        {/* User / plan section */}
        <div className="mt-auto border-t border-border pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all hover:bg-muted cursor-pointer hover:translate-x-0.5 duration-150">
                <div className="grid size-8.5 shrink-0 place-items-center rounded-full bg-violet-soft text-xs font-bold text-violet">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-bold text-foreground">{userName}</p>
                  <p className="text-[10px] text-muted-foreground">{planLabel}</p>
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl text-slate-800 z-50"
            >
              <div className="px-2.5 py-2">
                <p className="text-xs font-bold text-slate-900">{businessName}</p>
                <p className="text-[11px] font-medium text-slate-500">{profile?.phone || ""}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                <UserRound size={14} className="mr-2" /> Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut size={14} className="mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-[236px]">
        {/* Trial banner */}
        <TrialBanner />
        {/* Desktop header (Compact 60px height) */}
        <header className="sticky top-0 z-20 hidden h-[60px] items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur-sm lg:flex xl:px-8">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">Workspace / {section}</p>
            <h1 className="font-display text-lg font-bold text-foreground leading-tight">
              {section}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setSearchOpen(true)}
              className="h-8.5 w-[220px] justify-start border-border text-muted-foreground text-xs shadow-none"
            >
              <Search size={14} /> Search anything...
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8.5 border-border shadow-none"
              title="Notifications"
            >
              <Bell size={15} />
            </Button>
            <span className="mx-0.5 h-6 border-l border-border" />
            <div className="grid size-8 place-items-center rounded-full bg-violet-soft text-xs font-bold text-violet">
              {userInitials}
            </div>
            <Button
              onClick={() => setForm(action)}
              className="ml-1.5 h-8.5 rounded-lg px-3.5 text-xs font-bold"
            >
              <Plus size={15} /> Add{" "}
              {action === "lead"
                ? "Lead"
                : action === "deal"
                  ? "Deal"
                  : action === "task"
                    ? "Task"
                    : "Contact"}
            </Button>
          </div>
        </header>
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
          <Brand />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={18} />
            </Button>
            <div className="grid size-8 place-items-center rounded-full bg-violet-soft text-xs font-bold text-violet">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page Content with smooth page transition */}
        <main
          key={pathname}
          className="min-h-[calc(100vh-60px)] px-5 py-5 sm:px-6 xl:px-8 page-transition"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-30 grid h-[68px] grid-cols-5 rounded-[18px] border border-border bg-card px-1 shadow-[0_8px_35px_-12px_var(--border)] lg:hidden"
        aria-label="Bottom navigation"
      >
        {mobileNav.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors ${
              pathname === to || (to !== "/dashboard" && pathname.startsWith(to + "/"))
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon size={21} strokeWidth={pathname === to ? 2.5 : 1.9} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile FAB */}
      {!["/more", "/settings", "/analytics", "/calendar"].includes(pathname) && (
        <Button
          onClick={() => setForm(action)}
          aria-label={`Add ${action}`}
          className="fixed bottom-[calc(95px+env(safe-area-inset-bottom))] right-5 z-20 size-13 rounded-full shadow-lg lg:hidden"
        >
          <Plus size={24} />
        </Button>
      )}

      <QuickForm kind={form} onClose={() => setForm(null)} />

      {/* Global search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[20%] w-[calc(100%-32px)] max-w-lg translate-y-0 rounded-xl p-5">
          <DialogHeader>
            <DialogTitle>Search your workspace</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search leads, contacts, deals, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {query &&
              (results.length ? (
                results.map((item, i) => (
                  <Link
                    key={i}
                    to={item.to as "/leads/$leadId"}
                    params={item.params as { leadId: string }}
                    onClick={() => setSearchOpen(false)}
                    className="block rounded-lg px-3 py-3 hover:bg-muted"
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.detail}</span>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
              ))}
            {!query && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Start typing to search…
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BroadcastAnnouncementModal />
      <OccoRobotAssistant />
      <Toaster position="top-center" richColors />
    </div>
  );
}
