import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/lib/crm-context";
import type { Task } from "@/lib/crm-data";
import { PageTitle, TaskCard, EmptyState, QuickForm } from "@/components/crm-ui";
import { AppShell } from "@/components/crm-shell";
import { AccessGuard } from "@/components/access-guard";
import { isToday, parseISO } from "date-fns";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks | Occo Flow" },
      { name: "description", content: "Stay on top of today's to-dos and upcoming tasks." },
      { property: "og:title", content: "Tasks | Occo Flow" },
      { property: "og:description", content: "Stay on top of today's to-dos and upcoming tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  return (
    <AccessGuard>
      <AppShell>
        <TasksContent />
      </AppShell>
    </AccessGuard>
  );
}

function TasksContent() {
  const { tasks } = useCRM();
  const [tab, setTab] = useState<"Today" | "Upcoming" | "Completed">("Today");
  const [form, setForm] = useState<"task" | null>(null);

  const isTaskToday = (t: Task) => {
    if (t.date === "Today") return true;
    if (t.dueDate) {
      try {
        return isToday(parseISO(t.dueDate));
      } catch {
        return false;
      }
    }
    return false;
  };

  const isTaskDone = (t: Task) => t.status === "Completed" || Boolean(t.completed);

  const { filtered, counts } = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    for (const t of tasks) {
      if (isTaskDone(t)) {
        completedCount++;
      } else if (isTaskToday(t)) {
        todayCount++;
      } else {
        upcomingCount++;
      }
    }

    const list = tasks.filter((x) => {
      const done = isTaskDone(x);
      if (tab === "Completed") return done;
      if (done) return false;
      const today = isTaskToday(x);
      return tab === "Today" ? today : !today;
    });

    return {
      filtered: list,
      counts: {
        Today: todayCount,
        Upcoming: upcomingCount,
        Completed: completedCount,
      },
    };
  }, [tasks, tab]);

  return (
    <>
      <PageTitle
        title="Tasks"
        description="A little progress, every day."
        action={
          <Button
            onClick={() => setForm("task")}
            className="hidden sm:flex lg:hidden"
          >
            <Plus size={16} /> Add task
          </Button>
        }
      />
      <div className="mb-5 flex gap-2 border-b border-border">
        {(["Today", "Upcoming", "Completed"] as const).map((x) => (
          <Button
            key={x}
            variant="ghost"
            onClick={() => setTab(x)}
            className={`h-11 rounded-none border-b-2 px-3 text-sm shadow-none cursor-pointer ${
              tab === x
                ? "border-primary font-bold text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {x}{" "}
            <span className="ml-1 text-xs opacity-60">
              {counts[x]}
            </span>
          </Button>
        ))}
      </div>
      {filtered.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            tab === "Completed"
              ? "Nothing completed yet"
              : tab === "Today"
              ? "All clear for today"
              : "No upcoming tasks"
          }
          description={
            tab === "Completed"
              ? "Finished tasks will appear here."
              : "Add a task to keep your next step on track."
          }
          onAdd={() => setForm("task")}
          action="Add Task"
        />
      )}
      <QuickForm kind={form} onClose={() => setForm(null)} />
    </>
  );
}
