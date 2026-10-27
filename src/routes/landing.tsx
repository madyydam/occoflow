import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart2, Users, Phone, Kanban, ListTodo, TrendingUp, Menu, X, Check, ArrowRight, ChevronRight, ChevronDown, Sparkles, Code2, Crown, Zap, HelpCircle } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/lib/crm-data";
import { CustomSoftwareModal } from "@/components/custom-software-modal";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

const features = [
  { icon: Users, title: "Lead Management", desc: "Capture and track every inbound lead from one place." },
  { icon: Phone, title: "Follow-ups", desc: "Schedule reminders so you never miss a follow-up again." },
  { icon: Users, title: "Customer Management", desc: "Keep your entire contact database organised and searchable." },
  { icon: Kanban, title: "Sales Pipeline", desc: "Move deals through stages and see your pipeline instantly." },
  { icon: ListTodo, title: "Tasks & Reminders", desc: "Create tasks, assign priority and stay on top of your day." },
  { icon: BarChart2, title: "Analytics", desc: "See win rates, deal values and lead trends at a glance." },
];

const steps = [
  { num: "01", title: "Add Your Leads", desc: "Capture new leads in seconds — name, phone, email, source." },
  { num: "02", title: "Follow Up & Manage", desc: "Schedule calls, add notes, move leads through your pipeline." },
  { num: "03", title: "Close More Business", desc: "Track deals, mark won and see your revenue grow." },
];

const faqItems = [
  {
    q: "What is Occo Flow?",
    a: "Occo Flow is an all-in-one business CRM and sales operating system created by Heyocco. It helps businesses capture leads, manage sales pipelines, assign team tasks, automate WhatsApp payment reminders with UPI QR codes, and gain real-time visibility into revenue."
  },
  {
    q: "What is Occo in Occo Flow?",
    a: "Occo is the built-in AI robot assistant copilot in Occo Flow. Occo can automatically import leads, create deals, schedule follow-ups, summarize daily focus priorities, and answer natural language business queries."
  },
  {
    q: "Does Occo Flow offer a free trial?",
    a: "Yes, Occo Flow offers a full-featured 3-day free trial with zero credit card required upon workspace creation."
  },
  {
    q: "How does Occo Flow handle WhatsApp and UPI payments?",
    a: "Occo Flow allows businesses to configure their UPI ID and automatically generates dynamic UPI QR codes and prefilled WhatsApp reminder messages. You can collect payments directly into your bank account with zero platform commission."
  },
  {
    q: "Can I import leads from Excel or CSV files?",
    a: "Yes. Occo Flow includes bulk CSV and Excel lead import and export with automatic column mapping, duplicate detection, and instant team member assignment."
  },
  {
    q: "Who develops and maintains Occo Flow?",
    a: "Occo Flow is developed and operated by Heyocco (https://flow.heyocco.com)."
  }
];

const monthlyFeatures = [
  "Unlimited leads, contacts & deals",
  "Kanban sales pipeline & deal stages",
  "Occo AI Robot copilot assistant",
  "Payment reminders (WhatsApp & Email)",
  "Instant UPI QR Code & payment links",
  "Team module & task delegation",
  "Bulk Excel lead import & export",
];
const yearlyFeatures = [
  "Everything in Monthly Plan included",
  "Save ₹1,989/year (2 months free, ~₹833/mo)",
  "Priority 24/7 dedicated support",
  "Annual business audit & analytics export",
  "Team workload tracking & reports",
  "Multi-device cloud synchronization",
];
const lifetimeFeatures = [
  "Pay Once — Own Forever (Zero Renewals)",
  "Lifetime access to all future CRM upgrades",
  "Unlimited team members & task assignments",
  "Unlimited leads, deals & invoices forever",
  "Lifetime Occo Robot Bot assistant",
  "VIP dedicated WhatsApp support line",
];
const customFeatures = [
  "Tailor-made CRM built for your company",
  "Custom ERP, Tally & WhatsApp API syncing",
  "Private cloud or on-premise deployment",
  "Dedicated senior solutions engineer",
  "Custom database fields & multi-level roles",
  "Full SLA & guaranteed uptime support",
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [customSoftwareOpen, setCustomSoftwareOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white font-sans text-[#0f172a]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/landing" className="flex items-center gap-2.5 no-underline">
            <img src="/logo.png" alt="Occo Flow" className="size-8 rounded-xl object-contain" />
            <span className="font-display text-[17px] font-extrabold text-[#0f172a]">{BRAND}</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-[#2563eb]">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-[#2563eb]">How It Works</a>
            <a href="#pricing" className="transition-colors hover:text-[#2563eb]">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-[#2563eb]">FAQ</a>
            <Link to="/auth/login" className="transition-colors hover:text-[#2563eb]">Login</Link>
            <Link
              to="/auth/signup"
              className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Get Started
            </Link>
          </nav>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden rounded-md p-2 text-slate-600"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 pb-4 md:hidden">
            <nav className="flex flex-col gap-1 pt-2 text-sm font-medium text-slate-700">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 hover:bg-slate-50">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 hover:bg-slate-50">How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 hover:bg-slate-50">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 hover:bg-slate-50">FAQ</a>
              <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 hover:bg-slate-50">Login</Link>
              <Link
                to="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 rounded-lg bg-[#2563eb] px-4 py-3 text-center font-semibold text-white"
              >
                Start 3-Day Free Trial
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f6ff] to-white px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Simple CRM for growing businesses
            </span>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-5xl lg:text-[56px]">
              Manage Your Leads.<br />
              <span className="text-[#2563eb]">Grow Your Business.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
              Simple CRM software for businesses that want to manage leads, follow-ups, customers and sales from one place.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/auth/signup"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1d4ed8] hover:shadow-lg sm:w-auto"
              >
                Start 3-Day Free Trial
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Login
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">3 days free · No credit card required</p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-blue-900/10">
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="bg-white p-6">
              {/* Mini dashboard preview */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Leads", val: "—", color: "bg-blue-50 text-blue-700" },
                  { label: "New Leads", val: "—", color: "bg-violet-50 text-violet-700" },
                  { label: "Follow-ups Today", val: "—", color: "bg-amber-50 text-amber-700" },
                  { label: "Open Deals", val: "—", color: "bg-green-50 text-green-700" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">{m.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{m.val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Leads</p>
                <div className="space-y-2">
                  {["Add your first lead to get started", "Your leads will appear here", "Start your free trial to begin"].map((t, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 border border-slate-100">
                      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users size={14} className="text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2563eb]">Features</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#0f172a] sm:text-4xl">Everything you need</h2>
            <p className="mt-3 text-base text-slate-500">Simple, powerful tools built for business owners.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
              >
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] transition-colors group-hover:bg-blue-100">
                  <Icon size={21} />
                </div>
                <h3 className="text-base font-bold text-[#0f172a]">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#f8faff] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2563eb]">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#0f172a] sm:text-4xl">Get started in minutes</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#2563eb] text-xl font-extrabold text-white shadow-md shadow-blue-200">
                  {num}
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2563eb]">Pricing &amp; Plans</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#0f172a] sm:text-4xl">Simple, honest pricing for growing businesses</h2>
            <p className="mt-3 text-sm text-slate-500">
              Start with a 3-day free trial on monthly and yearly plans. Or get lifetime access with zero renewals.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Monthly Plan */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Monthly Plan</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-[#0f172a]">
                    ₹999
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/month</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Billed monthly · Cancel anytime</p>

                <Link
                  to="/auth/signup"
                  search={{ plan: "crm_monthly", billing: "monthly" }}
                  className="mt-6 block rounded-xl border-2 border-[#2563eb] px-5 py-3 text-center text-xs sm:text-sm font-bold text-[#2563eb] transition-colors hover:bg-blue-50"
                >
                  Start 3-Day Free Trial
                </Link>

                <hr className="my-5 border-slate-100" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Included Features:</p>
                <ul className="space-y-2.5">
                  {monthlyFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check size={14} className="shrink-0 text-green-500 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Yearly Plan */}
            <div className="rounded-2xl border-2 border-[#2563eb] bg-[#f0f6ff]/70 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-md ring-1 ring-blue-200">
              <span className="absolute right-4 top-4 rounded-full bg-[#2563eb] px-3 py-0.5 text-[10px] font-bold text-white shadow-xs">
                Save ₹1,989 · Best Value
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#2563eb]" />
                  <p className="text-xs font-bold uppercase tracking-wide text-[#2563eb]">Yearly Plan</p>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-[#0f172a]">
                    ₹9,999
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/year</span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-emerald-700">
                  Effective ~₹833/mo · <span className="font-bold">2 Months Free</span>
                </p>

                <Link
                  to="/auth/signup"
                  search={{ plan: "crm_yearly", billing: "yearly" }}
                  className="mt-6 block rounded-xl bg-[#2563eb] px-5 py-3 text-center text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#1d4ed8] shadow-sm"
                >
                  Start 3-Day Free Trial
                </Link>

                <hr className="my-5 border-blue-100" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700/80 mb-3">Everything in Monthly, Plus:</p>
                <ul className="space-y-2.5">
                  {yearlyFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check size={14} className="shrink-0 text-blue-600 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lifetime Plan */}
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/50 via-white to-white p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
              <span className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-xs">
                Lifetime Deal
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <Crown size={14} className="text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Lifetime Access</p>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-[#0f172a]">
                    ₹14,999
                  </span>
                  <span className="text-sm font-semibold text-slate-500">one-time</span>
                </div>
                <p className="mt-1.5 text-xs text-amber-800 font-medium">Pay once · Own forever · Zero recurring bills</p>

                <Link
                  to="/auth/signup"
                  search={{ plan: "crm_lifetime", billing: "lifetime", mode: "purchase" }}
                  className="mt-6 block rounded-xl bg-slate-900 px-5 py-3 text-center text-xs sm:text-sm font-bold text-white transition-colors hover:bg-slate-800 shadow-sm"
                >
                  Get Lifetime Access
                </Link>

                <hr className="my-5 border-amber-100" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800/80 mb-3">Lifetime Privileges:</p>
                <ul className="space-y-2.5">
                  {lifetimeFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check size={14} className="shrink-0 text-amber-600 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Custom Build (Bespoke) */}
            <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 text-white p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
              <span className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-bold text-yellow-300 flex items-center gap-1">
                <Sparkles size={11} className="text-yellow-400" />
                <span>Bespoke</span>
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <Code2 size={14} className="text-yellow-400" />
                  <p className="text-xs font-bold uppercase tracking-wide text-yellow-300">Custom Build</p>
                </div>
                <div className="mt-4">
                  <p className="font-display text-3xl font-extrabold text-white tracking-tight">
                    Custom Quote
                  </p>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">Tailored to your company's workflows &amp; systems</p>

                <button
                  type="button"
                  onClick={() => setCustomSoftwareOpen(true)}
                  className="mt-6 block w-full rounded-xl bg-white px-5 py-3 text-center text-xs sm:text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-blue-50 cursor-pointer"
                >
                  Request Custom Build
                </button>

                <hr className="my-5 border-slate-800" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Enterprise Scope:</p>
                <ul className="space-y-2.5">
                  {customFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check size={14} className="shrink-0 text-emerald-400 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="border-t border-slate-100 bg-slate-50/60 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-700">
              <HelpCircle size={13} />
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to know about Occo Flow
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Direct, transparent answers regarding features, Occo AI copilot, pricing, and integrations.
            </p>
          </div>

          <div className="mt-12 space-y-3.5">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-blue-200"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-base sm:text-lg font-bold text-slate-900" itemProp="name">
                      {item.q}
                    </span>
                    <span className={`shrink-0 rounded-full p-1.5 transition-transform duration-200 ${isOpen ? "rotate-180 bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="px-5 pb-6 sm:px-6 text-sm sm:text-base leading-relaxed text-slate-600 border-t border-slate-100/80 pt-4"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p itemProp="text">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#2563eb] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to organise your business?
          </h2>
          <p className="mt-4 text-blue-100">3 days free. No credit card required. Cancel anytime.</p>
          <Link
            to="/auth/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#2563eb] shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
          >
            Start 3-Day Free Trial
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/landing" className="flex items-center gap-2.5 no-underline">
              <img src="/logo.png" alt="Occo Flow" className="size-8 rounded-xl object-contain" />
              <span className="font-display text-base font-extrabold text-[#0f172a]">{BRAND}</span>
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <a href="#features" className="hover:text-slate-800">Features</a>
              <a href="#pricing" className="hover:text-slate-800">Pricing</a>
              <a href="#faq" className="hover:text-slate-800">FAQ</a>
              <Link to="/auth/login" className="hover:text-slate-800">Login</Link>
              <Link to="/auth/signup" className="hover:text-slate-800">Start Free Trial</Link>
              <a href="#" className="hover:text-slate-800">Privacy Policy</a>
              <a href="#" className="hover:text-slate-800">Terms</a>
              <a href="mailto:hello@heyocco.com" className="hover:text-slate-800">Contact</a>
            </nav>
          </div>
          <p className="mt-6 text-xs text-slate-400">© {new Date().getFullYear()} Heyocco. All rights reserved.</p>
        </div>
      </footer>

      <CustomSoftwareModal
        open={customSoftwareOpen}
        onOpenChange={setCustomSoftwareOpen}
      />
    </div>
  );
}
