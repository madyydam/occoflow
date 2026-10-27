import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Phone, Mail, Building2, Clock3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/lib/crm-context";
import { PageTitle, SearchBar, Avatar, EmptyState, QuickForm } from "@/components/crm-ui";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts | Occo Flow" },
      { name: "description", content: "Find customer contact details and stay connected." },
      { property: "og:title", content: "Contacts | Occo Flow" },
      { property: "og:description", content: "Find customer contact details and stay connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <AccessGuard>
      <AppShell>
        <ContactsContent />
      </AppShell>
    </AccessGuard>
  );
}

function ContactsContent() {
  const { contacts } = useCRM();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<"contact" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter((x) =>
      `${x.name} ${x.company} ${x.phone} ${x.email}`.toLowerCase().includes(q),
    );
  }, [contacts, query]);

  const active = useMemo(
    () => (selected ? contacts.find((x) => x.id === selected) : undefined),
    [contacts, selected],
  );

  return (
    <>
      <PageTitle
        title="Contacts"
        description={`${contacts.length} people in your network`}
        action={
          <Button className="hidden sm:flex lg:hidden" onClick={() => setForm("contact")}>
            <Plus size={16} /> Add contact
          </Button>
        }
      />
      <div className="mb-5">
        <SearchBar value={query} onChange={setQuery} placeholder="Search contacts..." />
      </div>
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelected(contact.id)}
              className="w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar name={contact.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{contact.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{contact.company}</p>
                </div>
                <ChevronRight size={17} className="text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="truncate">{contact.phone}</span>
                <span className="shrink-0">{contact.lastInteraction}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title={query ? "No contacts found" : "No contacts yet"}
          description={
            query
              ? "Try a different name, phone or company."
              : "Add your first contact to keep everyone in one place."
          }
          action="Add Contact"
          onAdd={() => setForm("contact")}
        />
      )}
      <QuickForm kind={form} onClose={() => setForm(null)} />
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-xl bg-card p-6 sm:rounded-xl shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <Avatar name={active.name} size="lg" />
              <div>
                <h2 className="font-display text-xl font-bold">{active.name}</h2>
                <p className="text-sm text-muted-foreground">{active.company}</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 border-t border-border pt-5 text-sm">
              <p className="flex items-center gap-3">
                <Phone size={17} className="text-muted-foreground" />
                {active.phone}
              </p>
              <p className="flex items-center gap-3">
                <Mail size={17} className="text-muted-foreground" />
                {active.email}
              </p>
              <p className="flex items-center gap-3">
                <Building2 size={17} className="text-muted-foreground" />
                {active.company}
              </p>
              <p className="flex items-center gap-3">
                <Clock3 size={17} className="text-muted-foreground" />
                Last interaction: {active.lastInteraction}
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              {active.leadId && (
                <Button asChild className="flex-1">
                  <Link
                    to="/leads/$leadId"
                    params={{ leadId: active.leadId }}
                    onClick={() => setSelected(null)}
                  >
                    View lead
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
