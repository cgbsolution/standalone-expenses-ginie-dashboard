"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, FileEdit, FileText, XCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyExpenses } from "@/lib/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditTrailEntry } from "@/types/common";
import type { MasterExpense } from "@/types/expense";

interface FeedItem {
  id: string;
  expenseId: string;
  expenseTitle: string;
  at: string;
  by: string;
  from?: string;
  to: string;
  comments?: string;
  reason?: string;
}

export default function ActivityPage() {
  const userEmail = useAuthStore((s) => s.session?.user.email ?? "");
  const { data: expenses, isLoading } = useMyExpenses(userEmail);

  const feed = useMemo(() => buildFeed(expenses ?? []), [expenses]);

  return (
    <>
      <PageHeader
        title="Recent activity"
        description="Every status change on your expenses — newest first"
      />

      <SectionCard
        title="Timeline"
        description={feed.length === 0 ? undefined : `${feed.length} events`}
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <EmptyState
            title="Nothing has happened yet"
            description="Submit an expense from the mobile app and you'll see activity here."
          />
        ) : (
          <ol className="space-y-3">
            {feed.map((item) => (
              <FeedRow key={item.id} item={item} />
            ))}
          </ol>
        )}
      </SectionCard>
    </>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const { Icon, accent, label } = iconForStatus(item.to);
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
          accent,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{item.expenseTitle}</span>{" "}
          <span className="text-muted-foreground">{label}</span>
        </p>
        {item.comments ? (
          <p className="mt-0.5 text-xs text-muted-foreground">"{item.comments}"</p>
        ) : null}
        {item.reason ? (
          <p className="mt-0.5 text-xs text-destructive">Reason: {item.reason}</p>
        ) : null}
        <p className="mt-1 text-[11px] text-muted-foreground" title={formatDate(item.at)}>
          by {item.by} · {formatRelative(item.at)}
        </p>
      </div>
    </li>
  );
}

function iconForStatus(status: string) {
  switch (status) {
    case "Approved":
      return {
        Icon: CheckCircle2,
        accent: "bg-success/10 ring-success/20 text-success",
        label: "was approved",
      };
    case "Rejected":
      return {
        Icon: XCircle,
        accent: "bg-destructive/10 ring-destructive/20 text-destructive",
        label: "was rejected",
      };
    case "Pending":
      return {
        Icon: Clock,
        accent: "bg-warning/10 ring-warning/20 text-warning",
        label: "moved to pending",
      };
    case "Draft":
      return {
        Icon: FileEdit,
        accent: "bg-muted ring-border text-muted-foreground",
        label: "moved to draft",
      };
    default:
      return {
        Icon: FileText,
        accent: "bg-primary/10 ring-primary/20 text-primary",
        label: `moved to ${status}`,
      };
  }
}

function buildFeed(expenses: MasterExpense[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const e of expenses) {
    const history: AuditTrailEntry[] = Array.isArray(e.ApprovalHistory) ? e.ApprovalHistory : [];
    history.forEach((h, idx) => {
      items.push({
        id: `${e.id}-${idx}`,
        expenseId: e.id,
        expenseTitle: e.ExpenseTitle,
        at: h.at,
        by: h.by,
        from: h.from,
        to: h.to,
        comments: h.comments,
        reason: h.reason,
      });
    });
  }
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
