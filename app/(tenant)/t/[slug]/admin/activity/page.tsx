"use client";

import { useMemo, useState } from "react";
import { Check, X, Send, RotateCcw, Clock, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { useAllExpenses } from "@/lib/hooks/use-expenses";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MasterExpense } from "@/types/expense";

type Tone = "submit" | "approve" | "reject" | "forward" | "other";
type Event = {
  key: string;
  at: string;
  actor: string;
  tone: Tone;
  title: string;
  amount: number;
  comments?: string;
};

const TONE = {
  submit: { icon: Send, cls: "bg-primary/10 text-primary", verb: "submitted" },
  approve: { icon: Check, cls: "bg-success/15 text-success", verb: "approved" },
  reject: { icon: X, cls: "bg-destructive/15 text-destructive", verb: "rejected" },
  forward: { icon: RotateCcw, cls: "bg-warning/15 text-warning", verb: "forwarded to finance" },
  other: { icon: Clock, cls: "bg-muted text-muted-foreground", verb: "updated" },
} as const;

function toneFor(entry: { to?: string; action_status?: string; from?: string }): Tone {
  const a = (entry.action_status || "").toLowerCase();
  const to = (entry.to || "").toLowerCase();
  if (a.includes("finance") || a.includes("forward")) return "forward";
  if (to === "approved") return "approve";
  if (to === "rejected") return "reject";
  if (entry.from === "Start" || to === "pending") return "submit";
  return "other";
}

function buildEvents(expenses: MasterExpense[]): Event[] {
  const events: Event[] = [];
  for (const exp of expenses) {
    (exp.ApprovalHistory ?? []).forEach((h, i) => {
      events.push({
        key: `${exp.id}-${i}`,
        at: h.at,
        actor: h.by,
        tone: toneFor(h),
        title: exp.ExpenseTitle,
        amount: Number(exp.TotalAmount) || 0,
        comments: h.comments && !/^Rejected by\s+\S+\.\s/.test(h.comments) ? h.comments : undefined,
      });
    });
  }
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function dayBucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  return formatDate(iso, "EEEE, MMM d");
}

export default function ActivityPage() {
  const { data: expenses, isLoading } = useAllExpenses();
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    let events = buildEvents(expenses ?? []);
    const term = q.trim().toLowerCase();
    if (term) {
      events = events.filter(
        (e) => e.actor.toLowerCase().includes(term) || e.title.toLowerCase().includes(term),
      );
    }
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const k = dayBucket(e.at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return Array.from(map.entries());
  }, [expenses, q]);

  return (
    <>
      <PageHeader title="Activity" description="Every submission, approval, and rejection across your workspace" />

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by person or expense…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : grouped.length === 0 ? (
        <EmptyState icon={Clock} title="No activity yet" description="Actions across your workspace will appear here as they happen." />
      ) : (
        <div className="space-y-8">
          {grouped.map(([bucket, events]) => (
            <div key={bucket}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bucket}</p>
              <ol className="relative space-y-4 border-l border-border/60 pl-6">
                {events.map((e) => {
                  const t = TONE[e.tone];
                  const Icon = t.icon;
                  return (
                    <li key={e.key} className="relative">
                      <span className={cn("absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background", t.cls)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <UserAvatar name={e.actor} size="sm" />
                        <span className="font-medium">{e.actor.split("@")[0]}</span>
                        <span className="text-muted-foreground">{t.verb}</span>
                        <span className="font-medium">&ldquo;{e.title}&rdquo;</span>
                        <CurrencyDisplay value={e.amount} currency="INR" compact className="text-muted-foreground" />
                        <span className="ml-auto text-xs text-muted-foreground" title={formatDate(e.at, "PPpp")}>{formatRelative(e.at)}</span>
                      </div>
                      {e.comments ? <p className="mt-1 text-xs text-muted-foreground">{e.comments}</p> : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
