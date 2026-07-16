"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowDownAZ, Check, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpenseDetailDrawer } from "@/components/admin/expense-detail-drawer";

import { ApprovalCard } from "@/components/admin/approval-card";
import { TieredAmount } from "@/components/admin/amount-tier";
import { isOverdue } from "@/components/admin/aging-indicator";
import { StatusBadge } from "@/components/shared/status-badge";

import { useApproverExpenses, useUpdateExpenseStatus } from "@/lib/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApprovalStatus, MasterExpense } from "@/types/expense";

type StatusTab = "Pending" | "Approved" | "Rejected" | "All";
type SortKey = "oldest" | "newest" | "amount-desc" | "amount-asc";

export default function ApprovalsPage() {
  const userEmail = useAuthStore((s) => s.session?.user.email ?? "");
  const { data: expenses, isLoading, error, refetch, isFetching } = useApproverExpenses(userEmail);
  const { mutateAsync, isPending } = useUpdateExpenseStatus();

  const [tab, setTab] = useState<StatusTab>("Pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("oldest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const counts = useMemo(() => countByStatus(expenses ?? []), [expenses]);
  const visible = useMemo(
    () => filterAndSort(expenses ?? [], tab, search, sort),
    [expenses, tab, search, sort],
  );

  const overdueCount = (expenses ?? []).filter(
    (e) => e.ApprovalStatus === "Pending" && isOverdue(e.SubmissionDate),
  ).length;

  const allVisibleIds = visible.map((e) => e.id);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
  const someVisibleSelected = !allVisibleSelected && allVisibleIds.some((id) => selected.has(id));

  const selectedExpenses = (expenses ?? []).filter((e) => selected.has(e.id));
  const selectedSum = selectedExpenses.reduce(
    (s, e) => s + (Number(e.TotalAmount) || sumInvoices(e)),
    0,
  );

  function toggleOne(id: string, next: boolean) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allVisibleSelected) allVisibleIds.forEach((id) => n.delete(id));
      else allVisibleIds.forEach((id) => n.add(id));
      return n;
    });
  }

  async function decideOne(id: string, status: "Approved" | "Rejected") {
    await mutateAsync({ id, ApprovalStatus: status, UpdatedBy: userEmail });
  }

  async function decideMany(status: "Approved" | "Rejected") {
    const ids = [...selected];
    if (ids.length === 0) return;
    const verb = status === "Approved" ? "Approving" : "Rejecting";
    const toastId = toast.loading(`${verb} ${ids.length} ${ids.length === 1 ? "expense" : "expenses"}…`);
    let ok = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await mutateAsync({ id, ApprovalStatus: status, UpdatedBy: userEmail });
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    toast.dismiss(toastId);
    if (failed === 0) toast.success(`${status === "Approved" ? "Approved" : "Rejected"} ${ok} ${ok === 1 ? "expense" : "expenses"}`);
    else if (ok === 0) toast.error(`Could not update any expenses`);
    else toast.warning(`${ok} succeeded, ${failed} failed`);
    setSelected(new Set());
  }

  const activeExpense = drawerId ? (expenses ?? []).find((e) => e.id === drawerId) ?? null : null;

  return (
    <>
      <PageHeader
        title="Approvals"
        description={
          isLoading
            ? "Loading your queue…"
            : `${counts.Pending} waiting · ${overdueCount} overdue · ${counts.Approved + counts.Rejected} decided`
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
          <TabsList className="h-9">
            <TabsTrigger value="Pending" className="gap-2 px-3">
              Pending
              <CountPill n={counts.Pending} variant={overdueCount > 0 ? "warning" : "muted"} />
            </TabsTrigger>
            <TabsTrigger value="Approved" className="gap-2 px-3">
              Approved
              <CountPill n={counts.Approved} variant="muted" />
            </TabsTrigger>
            <TabsTrigger value="Rejected" className="gap-2 px-3">
              Rejected
              <CountPill n={counts.Rejected} variant="muted" />
            </TabsTrigger>
            <TabsTrigger value="All" className="gap-2 px-3">
              All
              <CountPill n={counts.All} variant="muted" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, ID, submitter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 pl-9"
            />
          </div>
          <SortMenu sort={sort} onSortChange={setSort} />
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="sticky top-16 z-30 mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 backdrop-blur-xl shadow-glow-sm">
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 font-medium text-foreground">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someVisibleSelected;
                }}
                onChange={toggleAllVisible}
                className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary focus:ring-1 focus:ring-ring"
              />
              {selected.size} selected
            </label>
            <span className="text-muted-foreground">
              ·{" "}
              <TieredAmount amount={selectedSum} className="text-xs" size="sm" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => decideMany("Rejected")}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
              Reject all
            </Button>
            <Button
              size="sm"
              onClick={() => decideMany("Approved")}
              disabled={isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Approve {selected.size}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </ul>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-5 w-5 text-destructive" />
          <p className="mt-2 text-sm font-semibold">Could not load</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(error as Error).message}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={tab === "Pending" ? Check : undefined}
          title={
            tab === "Pending"
              ? "Inbox zero"
              : search
                ? "No matches"
                : `No ${tab.toLowerCase()} expenses yet`
          }
          description={
            tab === "Pending"
              ? "Nothing waiting on your decision. Nice work."
              : search
                ? "Try a different search term."
                : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((e) => (
            <ApprovalCard
              key={e.id}
              expense={e}
              selected={selected.has(e.id)}
              onSelectedChange={(next) => toggleOne(e.id, next)}
              onApprove={() => decideOne(e.id, "Approved")}
              onReject={() => decideOne(e.id, "Rejected")}
              onOpen={() => setDrawerId(e.id)}
              disabled={isPending}
            />
          ))}
        </ul>
      )}

      <ExpenseDetailDrawer
        expense={activeExpense}
        open={!!drawerId}
        onOpenChange={(open) => !open && setDrawerId(null)}
        onApprove={() => activeExpense && decideOne(activeExpense.id, "Approved").then(() => setDrawerId(null))}
        onReject={() => activeExpense && decideOne(activeExpense.id, "Rejected").then(() => setDrawerId(null))}
        disabled={isPending}
      />
    </>
  );
}

function CountPill({ n, variant }: { n: number; variant: "muted" | "warning" }) {
  if (n === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
        variant === "warning"
          ? "bg-warning/15 text-warning"
          : "bg-muted text-muted-foreground",
      )}
    >
      {n}
    </span>
  );
}

function SortMenu({ sort, onSortChange }: { sort: SortKey; onSortChange: (s: SortKey) => void }) {
  const labels: Record<SortKey, string> = {
    oldest: "Oldest first",
    newest: "Newest first",
    "amount-desc": "Amount: high → low",
    "amount-asc": "Amount: low → high",
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <ArrowDownAZ className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">{labels[sort]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(labels) as SortKey[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onSelect={() => onSortChange(key)}
            className={cn(sort === key && "bg-secondary text-secondary-foreground")}
          >
            {labels[key]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function countByStatus(expenses: MasterExpense[]) {
  const counts: Record<StatusTab, number> = { All: expenses.length, Pending: 0, Approved: 0, Rejected: 0 };
  for (const e of expenses) {
    if (e.ApprovalStatus === "Pending") counts.Pending += 1;
    if (e.ApprovalStatus === "Approved") counts.Approved += 1;
    if (e.ApprovalStatus === "Rejected") counts.Rejected += 1;
  }
  return counts;
}

function filterAndSort(
  expenses: MasterExpense[],
  tab: StatusTab,
  search: string,
  sort: SortKey,
): MasterExpense[] {
  const q = search.trim().toLowerCase();
  const filtered = expenses.filter((e) => {
    if (tab !== "All" && e.ApprovalStatus !== (tab as ApprovalStatus)) return false;
    if (!q) return true;
    return (
      e.ExpenseTitle.toLowerCase().includes(q) ||
      e.ExpenseId.toLowerCase().includes(q) ||
      e.SubmitterName.toLowerCase().includes(q) ||
      e.SubmitterEmail.toLowerCase().includes(q)
    );
  });
  return filtered.sort((a, b) => {
    if (sort === "oldest") return new Date(a.SubmissionDate).getTime() - new Date(b.SubmissionDate).getTime();
    if (sort === "newest") return new Date(b.SubmissionDate).getTime() - new Date(a.SubmissionDate).getTime();
    const av = Number(a.TotalAmount) || sumInvoices(a);
    const bv = Number(b.TotalAmount) || sumInvoices(b);
    return sort === "amount-desc" ? bv - av : av - bv;
  });
}

function sumInvoices(e: MasterExpense): number {
  if (!Array.isArray(e.ExpenseData)) return 0;
  return e.ExpenseData.reduce((s, inv) => s + (Number(inv.InvoiceAmount) || 0), 0);
}
