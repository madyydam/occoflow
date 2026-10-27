import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  User,
  Plus,
  Briefcase,
  Calendar,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  Minimize2,
  Trash2,
  ChevronRight,
  Phone,
  Building2,
  IndianRupee,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/lib/crm-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { money, type LeadPriority, type LeadStatus, type DealStage } from "@/lib/crm-data";

/**
 * 3D Robot Face Avatar for Occo
 */
function OccoRobot3DAvatar({
  className = "size-8",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-sky-100 shadow-2xs select-none ${className}`}
    >
      <img
        src="/occo-robot-3d.png"
        alt="Occo 3D Robot Face"
        className="size-full object-cover pointer-events-none"
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}

interface ChatMessage {
  id: string;
  sender: "occo" | "user";
  text: string;
  actionCard?:
    | {
        type:
          "lead_created" | "deal_created" | "task_created" | "summary" | "bulk_leads" | "data_list";
        title: string;
        details?: Record<string, string | number> | undefined;
        items?:
          | Array<{
              title: string;
              subtitle?: string | undefined;
              badge?: string | undefined;
              badgeColor?: string | undefined;
              value?: string | undefined;
            }>
          | undefined;
      }
    | undefined;
  options?: string[] | undefined;
  timestamp: string;
}

interface ParsedBulkLead {
  name: string;
  phone: string;
  email: string;
  company: string;
  value: number;
  priority: LeadPriority;
}

/**
 * Intelligent parser for multi-line and CSV pasted leads
 */
function parseBulkLeadsText(rawText: string): ParsedBulkLead[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedBulkLead[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Skip command headers or CSV header rows
    if (
      lower.startsWith("add bulk lead") ||
      lower.startsWith("bulk lead") ||
      lower.startsWith("import lead") ||
      lower.startsWith("add multiple lead") ||
      lower.startsWith("name,phone") ||
      lower.startsWith("name, phone")
    ) {
      continue;
    }

    // Strip leading number / bullet: "1.", "1)", "-", "•", "*"
    let clean = line.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").trim();
    if (!clean) continue;

    // 1. Phone extraction (10-12 digits)
    const phoneMatch = clean.match(/(?:\+91[\s-]?)?[6789]\d{9}\b/);
    const phone = phoneMatch?.[0] ? phoneMatch[0].replace(/[\s-]/g, "") : "";
    if (phoneMatch?.[0]) clean = clean.replace(phoneMatch[0], " ");

    // 2. Email extraction
    const emailMatch = clean.match(/\b[\w.-]+@[\w.-]+\.\w+\b/);
    const email = emailMatch?.[0] || "";
    if (emailMatch?.[0]) clean = clean.replace(emailMatch[0], " ");

    // 3. Value extraction (₹, k, lakh, numbers)
    const valMatch = clean.match(
      /(?:value|val|₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|lakh|lakhs)?\b/i,
    );
    let value = 0;
    const rawValStr = valMatch?.[1];
    const matchValFull = valMatch?.[0];
    if (valMatch && rawValStr && matchValFull) {
      const rawNum = Number(rawValStr.replace(/,/g, ""));
      if (/k/i.test(matchValFull)) value = rawNum * 1000;
      else if (/lakh/i.test(matchValFull)) value = rawNum * 100000;
      else value = rawNum;
      clean = clean.replace(matchValFull, " ");
    }

    // 4. Priority
    let priority: LeadPriority = "Medium";
    if (/\b(?:urgent|high|hot)\b/i.test(clean)) {
      priority = "High";
      clean = clean.replace(/\b(?:urgent|high|hot)\b/gi, " ");
    } else if (/\b(?:low|cold)\b/i.test(clean)) {
      priority = "Low";
      clean = clean.replace(/\b(?:low|cold)\b/gi, " ");
    }

    // 5. Split remaining tokens by comma, pipe, or tab
    const parts = clean
      .split(/[,|\t]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let name = "";
    let company = "";

    const firstPart = parts[0] ?? "";
    if (parts.length >= 2) {
      name = firstPart;
      company = parts.slice(1).join(" ");
    } else if (parts.length === 1) {
      const compMatch = firstPart.match(/(?:at|from|company)\s+([A-Za-z0-9\s&.-]+)/i);
      const matchComp0 = compMatch?.[0];
      const matchComp1 = compMatch?.[1];
      if (compMatch && matchComp0 && matchComp1) {
        company = matchComp1.trim();
        name = firstPart.replace(matchComp0, "").trim();
      } else {
        name = firstPart;
      }
    }

    name = name.replace(/[,\-:|]/g, "").trim();
    company = company.replace(/[,\-:|]/g, "").trim();

    if (!name && phone) {
      name = `Lead ${phone.slice(-4)}`;
    }

    if (name) {
      results.push({
        name,
        phone,
        email,
        company,
        value,
        priority,
      });
    }
  }

  return results;
}

export function OccoRobotAssistant() {
  const {
    leads,
    deals,
    tasks,
    contacts,
    followUps,
    addLead,
    addLeadsBulk,
    addDeal,
    addTask,
    refresh,
  } = useCRM();
  const { profile, business } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userName = profile?.fullName?.split(" ")[0] || "there";

  // Initial greeting with cute robot personality
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "occo",
          text: `*Bleep-blop!* ( ^ ‿ ^ ) Hi ${userName}! I'm **Occo**, your personal robot assistant for **${business?.name || "your CRM"}**!\n\nI can bulk-import leads, run instant data queries, find contacts, schedule tasks, or fetch live reports on your business. What shall we do today?`,
          options: [
            "📋 Bulk Add Leads",
            "➕ Add a new lead",
            "🔥 High priority leads",
            "🏆 Top value leads",
            "📊 Pipeline summary",
            "⏰ Pending tasks",
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [userName, business?.name, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const rawPrompt = (textToSend || input).trim();
    if (!rawPrompt) return;

    if (!textToSend) {
      setInput("");
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: rawPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Process user command with AI parser
    setTimeout(async () => {
      try {
        const reply = await parseAndExecuteIntent(rawPrompt);
        setMessages((prev) => [...prev, reply]);
      } catch (err) {
        console.error("[Occo] Error executing command:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "occo",
            text: "*Oopsie!* ( > _ < ) My antenna had a tiny glitch processing that. Could you please say that again or rephrase?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 600);
  };

  // Natural Language Intent Engine with Cute Robot Personality & Specific User CRM Scoping
  const parseAndExecuteIntent = async (query: string): Promise<ChatMessage> => {
    const lower = query.toLowerCase().trim();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // ── 0. Friendly Greetings Intent ──────────────────────────────
    if (
      lower === "hi" ||
      lower === "hello" ||
      lower === "hey" ||
      lower === "hey occo" ||
      lower === "hi occo" ||
      lower === "hello occo" ||
      lower === "occo" ||
      lower === "hey max" ||
      lower === "hi max" ||
      lower === "hello max" ||
      lower.includes("how are you") ||
      lower.includes("who are you") ||
      lower.includes("what can you do")
    ) {
      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `*Happy beeps!* ( ˶ᵔ ᵕ ᵔ˶ ) Hello ${userName}! My circuits are buzzing at 100% and my antenna is glowing bright cyan! I'm your dedicated personal assistant for **${business?.name || "Workspace"}**.\n\nHere are superpowers I can execute for you:\n• **Bulk Import Leads:** Type \`Add bulk leads\` or paste your list\n• **Search Contacts & Leads:** Type \`Search [Name or Company]\`\n• **Priority Queries:** Type \`High priority leads\` or \`Hot leads\`\n• **Revenue Queries:** Type \`Top leads\` or \`Leads above 50000\`\n• **Task Tracking:** Type \`Pending tasks\`\n• **Pipeline Stats:** Type \`Pipeline summary\``,
        options: [
          "📋 Bulk Add Leads",
          "🔥 High priority leads",
          "🏆 Top value leads",
          "📊 Pipeline summary",
          "⏰ Pending tasks",
        ],
        timestamp: now,
      };
    }

    // ── Gratitude / Praise Intent ────────────────────────────────
    if (
      lower.includes("thank") ||
      lower.includes("thanks") ||
      lower.includes("good job") ||
      lower.includes("awesome") ||
      lower.includes("cute")
    ) {
      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `*Blushes in neon cyan* ( ˶• ֊ •˶ ) Aww, thank you! That warms my robotic battery! I love organizing **${business?.name || "your CRM"}**. Let me know what you need next!`,
        options: ["📋 Bulk Add Leads", "📊 Pipeline summary", "🔥 High priority leads"],
        timestamp: now,
      };
    }

    // ── 1. Bulk Add Leads Intent ───────────────────────────────────
    const isBulkPrompt =
      lower.startsWith("add bulk") ||
      lower.startsWith("bulk lead") ||
      lower.startsWith("import lead") ||
      lower.startsWith("bulk add") ||
      lower === "📋 bulk add leads" ||
      (query.includes("\n") && (query.match(/\d{9,10}/g)?.length || 0) >= 2);

    if (isBulkPrompt) {
      // If user is just asking how to do bulk add or clicked button
      if (
        lower === "add bulk leads" ||
        lower === "bulk leads" ||
        lower === "bulk add leads" ||
        lower === "import leads" ||
        lower === "📋 bulk add leads"
      ) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Bleep-blop!* ( ^ ‿ ^ ) Ready to bulk import leads into **${business?.name || "your CRM"}**!\n\nYou can paste multiple leads right here in this format:\n\n\`\`\`text\nAdd bulk leads:\n1. Rahul Sharma, 9876543210, Acme Corp, 50000\n2. Priya Singh, 9811223344, TechSoft, 75000\n3. Amit Verma, 9922334455, 30000\n\`\`\`\n\n*(You can format with comma, name, phone, company, and amount. I will parse and add all of them into your workspace database at once!)*`,
          options: ["➕ Add a new lead", "🔥 High priority leads", "📊 Pipeline summary"],
          timestamp: now,
        };
      }

      // Parse the provided leads
      const parsed = parseBulkLeadsText(query);
      if (parsed.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Beep-boop?* ( • ‿ • ) I couldn't detect any valid lead names or phone numbers in your text. Please provide leads in this format:\n\n👉 \`Name, Phone, Company, Value\` (e.g. *Rahul Sharma, 9876543210, TechCorp, 50000*)`,
          options: ["📋 Bulk Add Leads", "➕ Add a new lead"],
          timestamp: now,
        };
      }

      // Convert to Supabase payloads scoped to this business
      const payloads = parsed.map((p) => ({
        name: p.name,
        phone: p.phone,
        email: p.email,
        company: p.company,
        source: "Bulk Import / Occo",
        status: "New" as LeadStatus,
        priority: p.priority,
        value: p.value,
        notes: `Bulk imported by Occo Assistant on ${new Date().toLocaleDateString()}`,
        assignedUserId: profile?.id || null,
      }));

      const created = await addLeadsBulk(payloads);
      await refresh();

      const totalVal = created.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `✨ *Whirrr-beep!* ( ˶ᵔ ᵕ ᵔ˶ ) Success! I added **${created.length} new leads** directly to your **${business?.name || "Workspace"}** CRM database! (Total pipeline added: **${money(totalVal)}**)`,
        actionCard: {
          type: "bulk_leads",
          title: `Bulk Imported: ${created.length} Leads`,
          details: {
            "Total Imported": `${created.length} leads`,
            "Combined Value": money(totalVal),
            Status: "New",
            Workspace: business?.name || "Your Workspace",
          },
          items: created.slice(0, 10).map((l) => ({
            title: l.name,
            subtitle: [l.phone, l.company].filter(Boolean).join(" · ") || "No contact info",
            value: l.value ? money(l.value) : undefined,
            badge: l.priority,
            badgeColor:
              l.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
          })),
        },
        options: ["🔥 High priority leads", "📊 Pipeline summary", "⏰ Pending tasks"],
        timestamp: now,
      };
    }

    // ── 2. Search Specific Customer / Lead / Company ───────────────
    const isSearchQuery =
      lower.startsWith("search ") ||
      lower.startsWith("find ") ||
      lower.startsWith("who is ") ||
      lower.startsWith("details of ") ||
      lower.startsWith("tell me about ");

    if (isSearchQuery) {
      const term = lower
        .replace(/^(search|find|who is|details of|tell me about)\s+/i, "")
        .replace(/[?.]/g, "")
        .trim();

      if (term) {
        // Search current user's workspace leads & contacts ONLY
        const matchedLead = leads.find(
          (l) =>
            l.name.toLowerCase().includes(term) ||
            l.phone.includes(term) ||
            l.company.toLowerCase().includes(term) ||
            l.email.toLowerCase().includes(term),
        );

        const matchedContact = !matchedLead
          ? contacts.find(
              (c) =>
                c.name.toLowerCase().includes(term) ||
                c.phone.includes(term) ||
                c.company.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term),
            )
          : null;

        if (matchedLead) {
          return {
            id: crypto.randomUUID(),
            sender: "occo",
            text: `🎯 *Ding!* ( ^ ‿ ^ ) Found **${matchedLead.name}** in your **${business?.name || "Workspace"}** CRM database:`,
            actionCard: {
              type: "data_list",
              title: matchedLead.name,
              details: {
                Phone: matchedLead.phone || "Not set",
                Email: matchedLead.email || "Not set",
                Company: matchedLead.company || "Not set",
                Status: matchedLead.status,
                Priority: matchedLead.priority,
                "Potential Value": money(matchedLead.value),
                Source: matchedLead.source,
                Notes: matchedLead.notes || "None",
              },
            },
            options: [
              `💼 Add deal for ${matchedLead.name}`,
              `⏰ Remind me to call ${matchedLead.name} tomorrow`,
              "📊 Pipeline summary",
            ],
            timestamp: now,
          };
        }

        if (matchedContact) {
          return {
            id: crypto.randomUUID(),
            sender: "occo",
            text: `🎯 *Ding!* ( ^ ‿ ^ ) Found Contact **${matchedContact.name}** in your directory:`,
            actionCard: {
              type: "data_list",
              title: matchedContact.name,
              details: {
                Phone: matchedContact.phone || "Not set",
                Email: matchedContact.email || "Not set",
                Company: matchedContact.company || "Not set",
                Tags: matchedContact.tags?.join(", ") || "None",
              },
            },
            options: ["➕ Add a new lead", "📊 Pipeline summary"],
            timestamp: now,
          };
        }

        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Bleep!* ( • ‿ • ) I searched your CRM database, but couldn't find any lead or contact matching "*${term}*".\n\nWould you like me to add them as a new lead?`,
          options: [`➕ Add lead ${term}`, "📋 Bulk Add Leads", "📊 Pipeline summary"],
          timestamp: now,
        };
      }
    }

    // ── 3. High-Priority / Hot Leads Filter ─────────────────────────
    if (
      lower.includes("high priority") ||
      lower.includes("urgent lead") ||
      lower.includes("hot lead") ||
      lower === "🔥 high priority leads"
    ) {
      const highLeads = leads.filter(
        (l) => l.priority === "High" && l.status !== "Won" && l.status !== "Lost",
      );
      const totalVal = highLeads.reduce((s, l) => s + (Number(l.value) || 0), 0);

      if (highLeads.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `🌟 *Antenna blinking!* ( ˶• ֊ •˶ ) You currently have **0 high-priority leads** in your CRM database. All clear!`,
          options: ["➕ Add a new lead", "📋 Bulk Add Leads", "📊 Pipeline summary"],
          timestamp: now,
        };
      }

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `🔥 *Antenna glowing bright!* ( ˶• ֊ •˶ ) You have **${highLeads.length} High-Priority Leads** in your **${business?.name || "Workspace"}** CRM (Total pipeline: **${money(totalVal)}**):`,
        actionCard: {
          type: "data_list",
          title: `High-Priority Leads (${highLeads.length})`,
          details: {
            "Total Leads": highLeads.length,
            "Combined Value": money(totalVal),
            "Recommended Action": "Call today to convert",
          },
          items: highLeads.slice(0, 10).map((l) => ({
            title: l.name,
            subtitle: [l.phone, l.company].filter(Boolean).join(" · ") || "No phone",
            value: money(l.value),
            badge: l.status,
            badgeColor: "bg-amber-100 text-amber-800",
          })),
        },
        options: ["🏆 Top value leads", "📊 Pipeline summary", "⏰ Pending tasks"],
        timestamp: now,
      };
    }

    // ── 4. Top / Highest Value Leads Filter ────────────────────────
    if (
      lower.includes("top lead") ||
      lower.includes("biggest lead") ||
      lower.includes("highest value lead") ||
      lower.includes("high ticket") ||
      lower === "🏆 top value leads"
    ) {
      const sorted = [...leads]
        .filter((l) => l.status !== "Lost")
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 5);
      const totalVal = sorted.reduce((s, l) => s + (Number(l.value) || 0), 0);

      if (sorted.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Bleep!* ( • ‿ • ) You don't have any leads in your CRM yet. Add your first lead to start tracking potential revenue!`,
          options: ["➕ Add a new lead", "📋 Bulk Add Leads"],
          timestamp: now,
        };
      }

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `🏆 *Bleep-blop!* ( ˶ᵔ ᵕ ᵔ˶ ) Here are your **Top ${sorted.length} Highest Value Leads** in **${business?.name || "Workspace"}** (Combined value: **${money(totalVal)}**):`,
        actionCard: {
          type: "data_list",
          title: "Top Value Leads",
          details: {
            "Top Leads Combined": money(totalVal),
            "Highest Single Lead": sorted[0]
              ? `${sorted[0].name} (${money(sorted[0].value)})`
              : "N/A",
          },
          items: sorted.map((l, i) => ({
            title: `#${i + 1} ${l.name}`,
            subtitle: [l.phone, l.company].filter(Boolean).join(" · ") || "No phone",
            value: money(l.value),
            badge: l.priority,
            badgeColor:
              l.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
          })),
        },
        options: ["🔥 High priority leads", "📊 Pipeline summary", "➕ Add a new lead"],
        timestamp: now,
      };
    }

    // ── 5. Value Threshold Query (e.g., "leads above 50000") ───────
    const valThresholdMatch = lower.match(
      /(?:leads|deals)\s+(?:above|greater than|more than|over|>=|>)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|lakh|lakhs)?/i,
    );
    const rawThreshStr = valThresholdMatch?.[1];
    if (valThresholdMatch && rawThreshStr) {
      let threshold = Number(rawThreshStr.replace(/,/g, ""));
      const matchThreshFull = valThresholdMatch[0] ?? "";
      if (/k/i.test(matchThreshFull)) threshold *= 1000;
      else if (/lakh/i.test(matchThreshFull)) threshold *= 100000;

      const matchedLeads = leads.filter((l) => (Number(l.value) || 0) >= threshold);
      const totalVal = matchedLeads.reduce((s, l) => s + (Number(l.value) || 0), 0);

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `💰 *Ching-ching!* ( ^ ‿ ^ ) Found **${matchedLeads.length} leads with value ≥ ${money(threshold)}** in your CRM database (Total: **${money(totalVal)}**):`,
        actionCard: {
          type: "data_list",
          title: `Leads ≥ ${money(threshold)} (${matchedLeads.length})`,
          items: matchedLeads.slice(0, 10).map((l) => ({
            title: l.name,
            subtitle: [l.phone, l.company].filter(Boolean).join(" · ") || "No contact",
            value: money(l.value),
            badge: l.status,
            badgeColor: "bg-emerald-100 text-emerald-800",
          })),
        },
        options: ["🏆 Top value leads", "📊 Pipeline summary"],
        timestamp: now,
      };
    }

    // ── 6. Status / Stage Lead Queries ─────────────────────────────
    if (
      lower.includes("new lead") ||
      lower.includes("qualified lead") ||
      lower.includes("won lead") ||
      lower.includes("lost lead") ||
      lower.includes("contacted lead")
    ) {
      let targetStatus: LeadStatus = "New";
      if (lower.includes("qualified")) targetStatus = "Qualified";
      else if (lower.includes("won")) targetStatus = "Won";
      else if (lower.includes("lost")) targetStatus = "Lost";
      else if (lower.includes("contacted")) targetStatus = "Contacted";

      const filtered = leads.filter((l) => l.status === targetStatus);
      const totalVal = filtered.reduce((s, l) => s + (Number(l.value) || 0), 0);

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `📋 *Whirrr-click!* ( ^ ‿ ^ ) You have **${filtered.length} leads in '${targetStatus}' status** in your **${business?.name || "Workspace"}** CRM (Total: **${money(totalVal)}**):`,
        actionCard: {
          type: "data_list",
          title: `${targetStatus} Leads (${filtered.length})`,
          items: filtered.slice(0, 10).map((l) => ({
            title: l.name,
            subtitle: [l.phone, l.company].filter(Boolean).join(" · ") || "No phone",
            value: money(l.value),
            badge: l.priority,
            badgeColor:
              l.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
          })),
        },
        options: ["🔥 High priority leads", "📊 Pipeline summary", "➕ Add a new lead"],
        timestamp: now,
      };
    }

    // ── 7. Lead Acquisition Source Queries ─────────────────────────
    if (
      lower.includes("instagram") ||
      lower.includes("google") ||
      lower.includes("referral") ||
      lower.includes("lead source") ||
      lower.includes("where are my leads")
    ) {
      let specificSource = "";
      if (lower.includes("instagram")) specificSource = "Instagram";
      else if (lower.includes("google")) specificSource = "Google";
      else if (lower.includes("referral")) specificSource = "Referral";
      else if (lower.includes("website")) specificSource = "Website";

      if (specificSource) {
        const filtered = leads.filter((l) =>
          l.source.toLowerCase().includes(specificSource.toLowerCase()),
        );
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `🎯 *Ding-ding!* ( ˶ᵔ ᵕ ᵔ˶ ) You have **${filtered.length} leads from ${specificSource}** in your CRM database:`,
          actionCard: {
            type: "data_list",
            title: `${specificSource} Leads (${filtered.length})`,
            items: filtered.slice(0, 10).map((l) => ({
              title: l.name,
              subtitle: [l.phone, l.company].filter(Boolean).join(" · ") || "No phone",
              value: money(l.value),
              badge: l.status,
            })),
          },
          options: ["📊 Pipeline summary", "➕ Add a new lead"],
          timestamp: now,
        };
      }

      // Breakdown by all sources in this user's CRM
      const sourceCounts: Record<string, number> = {};
      leads.forEach((l) => {
        const src = l.source || "Other";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `📊 *Beep-boop!* Here is your **Lead Source Distribution** across your ${leads.length} leads in **${business?.name || "Workspace"}**:`,
        actionCard: {
          type: "summary",
          title: "Lead Acquisition Channels",
          details: Object.fromEntries(
            Object.entries(sourceCounts).map(([k, v]) => [
              k,
              `${v} leads (${Math.round((v / (leads.length || 1)) * 100)}%)`,
            ]),
          ),
        },
        options: ["🔥 High priority leads", "📊 Pipeline summary"],
        timestamp: now,
      };
    }

    // ── 8. Pending Tasks Query ─────────────────────────────────────
    if (
      lower.includes("pending task") ||
      lower.includes("my task") ||
      lower.includes("what to do") ||
      lower.includes("overdue") ||
      lower === "⏰ pending tasks"
    ) {
      const pending = tasks.filter((t) => !t.completed);
      const highPending = pending.filter((t) => t.priority === "High");

      if (pending.length === 0) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `🎉 *Whirrr-beep!* ( ˶ᵔ ᵕ ᵔ˶ ) High five! You have **0 pending tasks**! Your task calendar is completely clear!`,
          options: ["⏰ Schedule a task", "➕ Add a new lead", "📊 Pipeline summary"],
          timestamp: now,
        };
      }

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `⏰ *Ding-ding!* ( ˶• ֊ •˶ ) You have **${pending.length} pending tasks** in your workspace (${highPending.length} high priority):`,
        actionCard: {
          type: "data_list",
          title: `Pending Tasks (${pending.length})`,
          items: pending.slice(0, 8).map((t) => ({
            title: t.title,
            subtitle: [t.dueDate, t.dueTime].filter(Boolean).join(" at ") || "No due date",
            badge: t.priority,
            badgeColor:
              t.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
          })),
        },
        options: ["⏰ Schedule a task", "🔥 High priority leads", "📊 Pipeline summary"],
        timestamp: now,
      };
    }

    // ── 9. Deals by Stage Query ────────────────────────────────────
    if (
      lower.includes("deal") &&
      (lower.includes("proposal") ||
        lower.includes("negotiation") ||
        lower.includes("won") ||
        lower.includes("lost") ||
        lower.includes("list") ||
        lower.includes("top deal"))
    ) {
      let stage: DealStage | null = null;
      if (lower.includes("proposal")) stage = "Proposal";
      else if (lower.includes("negotiation")) stage = "Negotiation";
      else if (lower.includes("won")) stage = "Won";
      else if (lower.includes("lost")) stage = "Lost";

      const filtered = stage ? deals.filter((d) => d.stage === stage) : deals;
      const totalVal = filtered.reduce((s, d) => s + (Number(d.value) || 0), 0);

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `💼 *Whirrr-click!* ( ^ ‿ ^ ) Here are your **${filtered.length} deals** ${
          stage ? `in '${stage}' stage` : "in your pipeline"
        } (Total: **${money(totalVal)}**):`,
        actionCard: {
          type: "data_list",
          title: stage ? `${stage} Deals (${filtered.length})` : `All Deals (${deals.length})`,
          items: filtered.slice(0, 8).map((d) => ({
            title: d.title,
            subtitle: d.customer,
            value: money(d.value),
            badge: d.stage,
            badgeColor:
              d.stage === "Won" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800",
          })),
        },
        options: ["💼 Create a deal", "📊 Pipeline summary"],
        timestamp: now,
      };
    }

    // ── 10. Contacts Directory Query ───────────────────────────────
    if (
      lower.includes("contact") &&
      (lower.includes("show") ||
        lower.includes("list") ||
        lower.includes("how many") ||
        lower.includes("my"))
    ) {
      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `👥 *Happy beeps!* ( ˶ᵔ ᵕ ᵔ˶ ) You have **${contacts.length} saved customer contacts** in **${business?.name || "your CRM"}**:`,
        actionCard: {
          type: "data_list",
          title: `Contacts Directory (${contacts.length})`,
          items: contacts.slice(0, 8).map((c) => ({
            title: c.name,
            subtitle:
              [c.phone, c.company].filter(Boolean).join(" · ") || c.email || "No contact info",
            badge: c.tags?.[0] || "Customer",
          })),
        },
        options: ["➕ Add a new lead", "📊 Pipeline summary"],
        timestamp: now,
      };
    }

    // ── 11. Pipeline Summary Intent ────────────────────────────────
    if (
      lower.includes("summary") ||
      lower.includes("pipeline") ||
      lower.includes("stats") ||
      lower.includes("overview") ||
      lower.includes("how is my business") ||
      lower.includes("report")
    ) {
      const totalLeads = leads.length;
      const totalLeadVal = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      const totalDeals = deals.length;
      const totalDealVal = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const pendingTasks = tasks.filter((t) => !t.completed).length;

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `📊 *Bleep-boop!* Here is your live **${business?.name || "Workspace"}** snapshot:\n\n• **Total Leads:** ${totalLeads} (${money(totalLeadVal)} in pipeline)\n• **Active Deals:** ${totalDeals} (${money(totalDealVal)} deal volume)\n• **Pending Tasks:** ${pendingTasks} tasks waiting\n\n*( ^ ‿ ^ ) Your pipeline is active and healthy!*`,
        actionCard: {
          type: "summary",
          title: "Pipeline Overview",
          details: {
            "Total Leads": totalLeads,
            "Leads Potential": money(totalLeadVal),
            "Active Deals": totalDeals,
            "Deals Value": money(totalDealVal),
            "Tasks Pending": pendingTasks,
          },
        },
        options: [
          "📋 Bulk Add Leads",
          "➕ Add a new lead",
          "🔥 High priority leads",
          "⏰ Pending tasks",
        ],
        timestamp: now,
      };
    }

    // ── 12. Focus / Recommendations Intent ─────────────────────────
    if (
      lower.includes("focus") ||
      lower.includes("tips") ||
      lower.includes("advice") ||
      lower.includes("recommend") ||
      lower.includes("what should i do")
    ) {
      const highPriorityLeads = leads.filter(
        (l) => l.priority === "High" && l.status !== "Won" && l.status !== "Lost",
      );
      const highDeals = deals.filter((d) => d.stage === "Proposal" || d.stage === "Negotiation");

      let tipText =
        "🌟 *Antenna glowing!* ( ˶• ֊ •˶ ) **Occo's High-Impact Focus Tips for Today:**\n\n";

      if (highPriorityLeads.length > 0) {
        tipText += `1. **Reach Out to High Priority Leads:** You have **${highPriorityLeads.length}** hot leads waiting (including *${highPriorityLeads[0]?.name}*). Let's give them a call!\n`;
      } else {
        tipText += `1. **Generate New Leads:** Your high-priority queue is all clear! Try adding or importing new prospective customers.\n`;
      }

      if (highDeals.length > 0) {
        tipText += `2. **Close Hot Deals:** You have **${highDeals.length}** deals in Proposal / Negotiation stage worth over **${money(highDeals.reduce((acc, d) => acc + d.value, 0))}**.\n`;
      } else {
        tipText += `2. **Move Leads to Deals:** Convert your qualified leads into deals to track closing milestones.\n`;
      }

      tipText += `3. **Daily Follow-ups:** Clear today's calendar reminders to keep customers delighted!`;

      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: tipText,
        options: ["🔥 High priority leads", "➕ Add a new lead", "💼 Create a deal"],
        timestamp: now,
      };
    }

    // ── 13. Single Add Lead Intent ─────────────────────────────────
    if (
      lower.startsWith("add lead") ||
      lower.startsWith("new lead") ||
      lower.startsWith("create lead") ||
      lower === "➕ add a new lead"
    ) {
      if (
        lower === "add lead" ||
        lower === "new lead" ||
        lower === "create lead" ||
        lower === "➕ add a new lead"
      ) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Bleep!* ( ^ ‿ ^ ) Ready to log a lead! You can tell me in natural language, for example:\n\n👉 \`Add lead Ramesh Kumar 9820011223 TechCorp 50000\`\n\nor simply give me their name and phone number:`,
          timestamp: now,
        };
      }

      const cleaned = query.replace(/^(add lead|new lead|create lead)\s+/i, "").trim();

      const phoneMatch = cleaned.match(/(?:\+91[\s-]?)?[6789]\d{9}/);
      const phone = phoneMatch ? phoneMatch[0] : "";

      const valMatch = cleaned.match(
        /(?:value|val|₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|lakh|lakhs)?/i,
      );
      let value = 0;
      if (valMatch && valMatch[1]) {
        const rawNum = Number(valMatch[1].replace(/,/g, ""));
        if (/k/i.test(cleaned)) value = rawNum * 1000;
        else if (/lakh/i.test(cleaned)) value = rawNum * 100000;
        else value = rawNum;
      }

      const emailMatch = cleaned.match(/[\w.-]+@[\w.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : "";

      let namePart = cleaned;
      if (phone) namePart = namePart.replace(phone, "");
      if (email) namePart = namePart.replace(email, "");
      if (valMatch && valMatch[0]) namePart = namePart.replace(valMatch[0], "");
      namePart = namePart.replace(/(?:from|at|company|with|value|val|rs|inr)\b.*/i, "").trim();

      const name = namePart.trim() || "New Lead";
      const companyMatch = cleaned.match(
        /(?:at|company|firm|of)\s+([A-Za-z0-9\s&.-]+?)(?:\s+(?:with|value|phone|email|$))/i,
      );
      const company = (companyMatch && companyMatch[1]?.trim()) || "";

      const priority: LeadPriority =
        lower.includes("urgent") || lower.includes("high") ? "High" : "Medium";
      const source = lower.includes("instagram")
        ? "Instagram"
        : lower.includes("google")
          ? "Google"
          : lower.includes("referral")
            ? "Referral"
            : "Direct / Occo";

      const created = await addLead({
        name,
        phone,
        email,
        company,
        source,
        status: "New" as LeadStatus,
        priority,
        value,
        notes: `Created by Occo Assistant on ${new Date().toLocaleDateString()}`,
        assignedUserId: profile?.id || null,
      });

      if (created) {
        toast.success(`🤖 Occo: Lead '${name}' added to CRM!`);
        await refresh();
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `⚡ *Whirrr-beep!* ( ˶ᵔ ᵕ ᵔ˶ ) Lead **${created.name}** is safely tucked into your CRM database!`,
          actionCard: {
            type: "lead_created",
            title: created.name,
            details: {
              Phone: created.phone || "Not specified",
              Company: created.company || "Not specified",
              Status: created.status,
              Priority: created.priority,
              "Potential Value": money(created.value),
            },
          },
          options: ["➕ Add another lead", "📋 Bulk Add Leads", "⏰ Schedule a task for this lead"],
          timestamp: now,
        };
      }
    }

    // ── 14. Add Deal Intent ────────────────────────────────────────
    if (
      lower.startsWith("add deal") ||
      lower.startsWith("new deal") ||
      lower.startsWith("create deal") ||
      lower === "💼 create a deal"
    ) {
      if (
        lower === "add deal" ||
        lower === "new deal" ||
        lower === "create deal" ||
        lower === "💼 create a deal"
      ) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Bleep!* ( ^ ‿ ^ ) Ready to log a deal! Tell me like this:\n\n👉 \`Add deal Website Redesign for Acme Corp 75000\``,
          timestamp: now,
        };
      }

      const cleaned = query.replace(/^(add deal|new deal|create deal)\s+/i, "").trim();
      const valMatch = cleaned.match(/\b(\d+(?:,\d+)*(?:\.\d+)?)\b/);
      const value = valMatch && valMatch[1] ? Number(valMatch[1].replace(/,/g, "")) : 0;

      const customerMatch = cleaned.match(
        /(?:for|with|client|customer)\s+([A-Za-z0-9\s&.-]+?)(?:\s+(?:value|val|\d|$))/i,
      );
      const customer = (customerMatch && customerMatch[1]?.trim()) || "Valued Customer";

      let title = cleaned;
      if (customerMatch && customerMatch[0]) title = title.replace(customerMatch[0], "");
      if (valMatch && valMatch[0]) title = title.replace(valMatch[0], "");
      title = title.trim() || `Deal for ${customer}`;

      const created = await addDeal({
        id: crypto.randomUUID(),
        title,
        customer,
        value,
        stage: "New" as DealStage,
        closeDate: null,
      });

      if (created) {
        toast.success(`🤖 Occo: Deal '${title}' created!`);
        await refresh();
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `🎉 *Ding-ding!* ( ^ ‿ ^ ) Woohoo! Deal logged into your sales pipeline:`,
          actionCard: {
            type: "deal_created",
            title: created.title,
            details: {
              Customer: created.customer,
              Value: money(created.value),
              Stage: created.stage,
            },
          },
          options: ["💼 Create another deal", "📊 Pipeline summary"],
          timestamp: now,
        };
      }
    }

    // ── 15. Add Task Intent ────────────────────────────────────────
    if (
      lower.startsWith("add task") ||
      lower.startsWith("create task") ||
      lower.startsWith("schedule task") ||
      lower.startsWith("remind me") ||
      lower === "📅 schedule a task" ||
      lower === "⏰ schedule a task"
    ) {
      if (
        lower === "add task" ||
        lower === "create task" ||
        lower === "📅 schedule a task" ||
        lower === "⏰ schedule a task"
      ) {
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `*Ding!* ( ˶• ֊ •˶ ) I can set reminders and tasks for you! Try:\n\n👉 \`Remind me to call Rajesh tomorrow at 3 PM\`\n👉 \`Add task Send quote to Sharma Logistics\``,
          timestamp: now,
        };
      }

      const cleaned = query
        .replace(/^(add task|create task|schedule task|remind me to|remind me)\s+/i, "")
        .trim();
      const timeMatch = cleaned.match(/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
      const dueTime = timeMatch ? timeMatch[1]?.trim() : "";

      let targetDate = new Date().toISOString().split("T")[0] || "";
      if (lower.includes("tomorrow")) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        targetDate = d.toISOString().split("T")[0] || "";
      }

      const taskTitle =
        cleaned
          .replace(/\b(?:tomorrow|today|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi, "")
          .trim() || "Follow up";

      const created = await addTask({
        id: crypto.randomUUID(),
        title: taskTitle,
        customer: "General",
        dueDate: targetDate,
        dueTime: dueTime || "11:00 AM",
        priority: "High",
        status: "Pending",
        completed: false,
      });

      if (created) {
        toast.success(`🤖 Occo: Task scheduled!`);
        await refresh();
        return {
          id: crypto.randomUUID(),
          sender: "occo",
          text: `✅ *Whirrr-click!* ( ˶• ֊ •˶ ) Reminder locked in! I've scheduled "**${created.title}**" so you won't miss it!`,
          actionCard: {
            type: "task_created",
            title: created.title,
            details: {
              Date: targetDate,
              Time: dueTime || "11:00 AM",
              Priority: "High",
            },
          },
          options: ["⏰ Add another task", "📊 Pipeline summary"],
          timestamp: now,
        };
      }
    }

    // ── 16. Payment & Dues Intent ───────────────────────────────────
    if (
      lower.includes("payment") ||
      lower.includes("due") ||
      lower.includes("invoice") ||
      lower.includes("outstanding") ||
      lower.includes("upi")
    ) {
      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `💰 *Ching-ching!* ( ^ ‿ ^ ) **Payment Reminders & UPI Dues:**\n\nYou can track customer balances, aging buckets (0-30d, 31-60d, 90+d), send 1-click WhatsApp reminders with instant UPI QR codes, and record partial installments in the **Payment Dues** tab (/payments).`,
        options: ["📊 Pipeline summary", "➕ Add a new lead", "💼 Create a deal"],
        timestamp: now,
      };
    }

    // ── 17. Team & Member Delegation Intent ─────────────────────────
    if (
      lower.includes("team") ||
      lower.includes("invite") ||
      lower.includes("assign") ||
      lower.includes("colleague") ||
      lower.includes("member")
    ) {
      return {
        id: crypto.randomUUID(),
        sender: "occo",
        text: `👥 *Happy beeps!* ( ˶ᵔ ᵕ ᵔ˶ ) **Team & Workload Delegation:**\n\nYou can invite teammates, assign specific roles, balance workload, and delegate tasks under **Team & Delegation** (/team).`,
        options: ["⏰ Schedule a task", "📊 Pipeline summary", "➕ Add a new lead"],
        timestamp: now,
      };
    }

    // ── 18. Fallback & Smart Guidance ──────────────────────────────
    return {
      id: crypto.randomUUID(),
      sender: "occo",
      text: `*Beep-boop?* ( • ‿ • ) I heard: "*${query}*".\n\nI am your personal AI assistant for **${business?.name || "your CRM"}**. Here is what I can do for you:\n\n• **Bulk Add Leads:** Paste lines of leads or type \`Add bulk leads\`\n• **Search Your CRM:** Type \`Search [Name]\` or \`Who is [Company]\`\n• **Filter Leads:** Type \`High priority leads\` or \`Leads above 50000\`\n• **Add Leads:** \`Add lead [Name] [Phone] [Value]\`\n• **Create Deals:** \`Add deal [Title] for [Customer] [Amount]\`\n• **Set Reminders:** \`Remind me to [Task] tomorrow\`\n• **Pipeline Stats:** \`Pipeline summary\``,
      options: [
        "📋 Bulk Add Leads",
        "🔥 High priority leads",
        "🏆 Top value leads",
        "📊 Pipeline summary",
        "⏰ Pending tasks",
      ],
      timestamp: now,
    };
  };

  const clearChat = () => {
    setMessages([
      {
        id: "fresh",
        sender: "occo",
        text: `*Bleep-blop!* ( ^ ‿ ^ ) Fresh robotic memory booted up! All clean and ready for new tasks in **${business?.name || "your CRM"}**!`,
        options: [
          "📋 Bulk Add Leads",
          "➕ Add a new lead",
          "🔥 High priority leads",
          "📊 Pipeline summary",
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {/* ── Floating Robot Widget Button ────────────────────────────── */}
      <div className="fixed bottom-26 left-4 z-40 lg:bottom-6 lg:left-auto lg:right-6">
        {!isOpen && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 p-[2.5px] shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer ring-4 ring-sky-300/40 group overflow-visible"
              aria-label="Open Occo Personal Assistant"
            >
              {/* Pulse effect / Online badge */}
              <span className="absolute -top-1 -right-1 z-20 flex size-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
              </span>

              {/* 3D Robot Face */}
              <div className="relative size-full rounded-[13.5px] overflow-hidden bg-sky-100/90 shadow-inner flex items-center justify-center">
                <img
                  src="/occo-robot-3d.png"
                  alt="Occo 3D Robot Face"
                  className="size-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── MAX Robot Chat Window ───────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-22 left-3 sm:left-auto sm:right-6 z-50 flex h-[540px] max-h-[82vh] w-[calc(100vw-24px)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-sky-200/90 bg-white shadow-2xl transition-all font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-sky-100 bg-gradient-to-r from-blue-600 via-sky-600 to-sky-500 px-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative size-9.5 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/40 shadow-sm bg-sky-100">
                <img src="/occo-robot-3d.png" alt="Occo" className="size-full object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-sky-600" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold leading-tight">Occo</h3>
                <p className="text-[11px] text-sky-100 font-medium">your personal Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Occo"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {(m.sender === "occo" || (m.sender as string) === "max") && (
                  <div className="size-8 shrink-0 overflow-hidden rounded-xl ring-1 ring-sky-200/90 shadow-2xs bg-sky-100 mt-0.5">
                    <img src="/occo-robot-3d.png" alt="Occo" className="size-full object-cover" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs whitespace-pre-wrap"
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Action Card (e.g., Bulk Leads, Created Record, or Query Results) */}
                  {m.actionCard && (
                    <div className="rounded-xl border border-sky-100 bg-white/95 p-3 text-xs shadow-xs space-y-2">
                      {/* Card Header */}
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        {m.actionCard.type === "bulk_leads" ||
                        m.actionCard.type === "lead_created" ||
                        m.actionCard.type === "deal_created" ||
                        m.actionCard.type === "task_created" ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Database size={15} className="text-sky-600 shrink-0" />
                        )}
                        <span className="truncate">{m.actionCard.title}</span>
                      </div>

                      {/* Key-Value Details (if present) */}
                      {m.actionCard.details && Object.keys(m.actionCard.details).length > 0 && (
                        <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                          {Object.entries(m.actionCard.details).map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">{k}:</span>
                              <span className="font-semibold text-slate-800 text-right truncate">
                                {v}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Itemized List (if present: for bulk leads, filtered queries, top leads, tasks) */}
                      {m.actionCard.items && m.actionCard.items.length > 0 && (
                        <div className="space-y-1.5 border-t border-slate-100 pt-2 max-h-52 overflow-y-auto pr-0.5">
                          {m.actionCard.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/80 hover:bg-sky-50/60 p-2 border border-slate-100 transition-colors text-[11px]"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-800 truncate">
                                  {item.title}
                                </div>
                                {item.subtitle && (
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.value && (
                                  <span className="font-bold text-slate-900 text-[11px]">
                                    {item.value}
                                  </span>
                                )}
                                {item.badge && (
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                      item.badgeColor || "bg-sky-100 text-sky-800"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Quick Options */}
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSend(opt)}
                          className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 shadow-2xs hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer text-left"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] text-slate-400 ${m.sender === "user" ? "text-right" : "text-left"}`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === "user" && (
                  <div className="grid size-7.5 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 shadow-2xs mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="size-7.5 shrink-0 overflow-hidden rounded-xl ring-1 ring-sky-200/90 shadow-2xs bg-sky-100">
                  <img src="/occo-robot-3d.png" alt="Occo" className="size-full object-cover" />
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-2">
                  <span className="size-1.5 animate-bounce rounded-full bg-sky-500" />
                  <span className="size-1.5 animate-bounce [animation-delay:0.2s] rounded-full bg-sky-500" />
                  <span className="size-1.5 animate-bounce [animation-delay:0.4s] rounded-full bg-sky-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-slate-200 bg-white p-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask cute robot Occo to add lead, deal, or task..."
                className="h-10 flex-1 rounded-xl border-slate-200 bg-slate-50 text-xs shadow-none placeholder:text-slate-400 focus-visible:ring-sky-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="size-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-none cursor-pointer disabled:opacity-40"
              >
                <Send size={15} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Backward compatibility alias
export const MaxRobotAssistant = OccoRobotAssistant;
