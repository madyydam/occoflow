import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ListTodo, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/lib/crm-context";
import { PageTitle, EmptyState } from "@/components/crm-ui";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar | Occo Flow" },
      { name: "description", content: "See your follow-ups, tasks and meetings in one simple agenda." },
      { property: "og:title", content: "Calendar | Occo Flow" },
      { property: "og:description", content: "See your follow-ups, tasks and meetings in one simple agenda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AccessGuard>
      <AppShell>
        <CalendarContent />
      </AppShell>
    </AccessGuard>
  );
}

function CalendarContent() {
  const { leads, tasks } = useCRM();
  const [day, setDay] = useState(0);
  const [month, setMonth] = useState(8);
  const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const items = useMemo(() => {
    if (day === 0) {
      return [
        ...leads
          .filter((x) => x.followUp?.startsWith("Today"))
          .map((x) => ({
            id: x.id,
            time: (x.followUp ?? "").split(", ")[1] || "Anytime",
            title: `Follow up with ${x.name}`,
            detail: x.company,
            type: "Follow-up",
          })),
        ...tasks
          .filter((x) => !x.completed && x.date === "Today")
          .map((x) => ({
            id: x.id,
            time: x.time ?? "",
            title: x.title,
            detail: x.customer ?? "",
            type: "Task",
          })),
      ];
    }
    if (day === 1) {
      return tasks
        .filter((x) => x.date === "Tomorrow")
        .map((x) => ({
          id: x.id,
          time: x.time ?? "",
          title: x.title,
          detail: x.customer ?? "",
          type: "Task",
        }));
    }
    return [];
  }, [leads, tasks, day]);

  return (
    <>
      <PageTitle title="Calendar" description="Your schedule, at a glance." />
      <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ][month]}{" "}
              2026
            </h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() => setMonth((month + 11) % 12)}
                className="cursor-pointer"
              >
                <ChevronLeft size={17} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={() => setMonth((month + 1) % 12)}
                className="cursor-pointer"
              >
                <ChevronRight size={17} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["S", "M", "T", "W", "T", "F", "S"].map((x, i) => (
              <span key={i} className="py-2 font-semibold text-muted-foreground">
                {x}
              </span>
            ))}
            {Array.from({ length: month === 8 ? 2 : 3 }, (_, i) => (
              <span key={`blank${i}`} />
            ))}
            {Array.from({ length: 30 }, (_, i) => (
              <Button
                key={i}
                variant={month === 8 && i + 1 === 26 + day ? "default" : "ghost"}
                onClick={() => setDay(i + 1 - 26)}
                className="h-9 min-w-0 rounded-lg p-0 text-xs cursor-pointer"
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            {days.map((x, i) => (
              <Button
                key={i}
                variant={day === i ? "default" : "outline"}
                onClick={() => setDay(i)}
                className={`h-16 min-w-[62px] shrink-0 flex-col gap-1 rounded-lg shadow-none cursor-pointer ${
                  day !== i ? "border-border bg-card text-muted-foreground" : ""
                }`}
              >
                <span className="text-[10px]">{x}</span>
                <span className="font-display text-lg font-bold">{26 + i}</span>
              </Button>
            ))}
          </div>
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">
            {day === 0
              ? "Today"
              : day === 1
              ? "Tomorrow"
              : `${days[((day % 7) + 7) % 7]}, September ${26 + day}`}{" "}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              {items.length} events
            </span>
          </h2>
          {items.length ? (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-soft text-primary">
                    {item.type === "Task" ? (
                      <ListTodo size={19} />
                    ) : (
                      <Phone size={19} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.detail} · {item.type}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing scheduled"
              description="Follow-ups, tasks and meetings will appear here."
            />
          )}
        </div>
      </div>
    </>
  );
}
