"use client";

import { useMemo } from "react";
import { Download, TrendingUp, Receipt, Clock, Wallet } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTenantExpenses } from "@/lib/hooks/use-expenses";
import { formatDate, toAmount } from "@/lib/format";
import { expenseCategory } from "@/lib/expense";
import type { MasterExpense } from "@/types/expense";

const categoryOf = (exp: MasterExpense) => expenseCategory(exp);

// Robust total: use TotalAmount if it parses, else sum the invoice lines.
function expenseTotal(e: MasterExpense): number {
  const t = toAmount(e.TotalAmount);
  return t > 0 ? t : (e.ExpenseData ?? []).reduce((s, inv) => s + toAmount(inv.InvoiceAmount), 0);
}

function aggregate<T extends string>(rows: { key: T; amount: number }[]) {
  const map = new Map<T, { total: number; count: number }>();
  for (const r of rows) {
    const cur = map.get(r.key) || { total: 0, count: 0 };
    cur.total += r.amount;
    cur.count += 1;
    map.set(r.key, cur);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.total - a.total);
}

function toCsv(expenses: MasterExpense[]): string {
  const head = ["Expense ID", "Title", "Submitter", "Category", "Status", "Submitted", "Amount (INR)"];
  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const lines = expenses.map((e) =>
    [e.ExpenseId, e.ExpenseTitle, e.SubmitterName || e.SubmitterEmail, categoryOf(e), e.ApprovalStatus, e.SubmissionDate, expenseTotal(e)]
      .map(esc)
      .join(","),
  );
  return [head.map(esc).join(","), ...lines].join("\n");
}

export default function ReportsPage({ params }: { params: { slug: string } }) {
  const { data: expenses, isLoading } = useTenantExpenses(params.slug);

  const stats = useMemo(() => {
    const list = expenses ?? [];
    const amt = (e: MasterExpense) => expenseTotal(e);
    const approved = list.filter((e) => e.ApprovalStatus === "Approved");
    const pending = list.filter((e) => e.ApprovalStatus === "Pending");
    const totalApproved = approved.reduce((s, e) => s + amt(e), 0);
    const totalPending = pending.reduce((s, e) => s + amt(e), 0);
    const byCategory = aggregate(list.map((e) => ({ key: categoryOf(e), amount: amt(e) })));
    const byEmployee = aggregate(list.map((e) => ({ key: e.SubmitterName || e.SubmitterEmail, amount: amt(e) })));
    const maxCat = byCategory[0]?.total || 1;
    return {
      count: list.length,
      approvedCount: approved.length,
      totalApproved,
      totalPending,
      avg: list.length ? list.reduce((s, e) => s + amt(e), 0) / list.length : 0,
      byCategory,
      byEmployee,
      maxCat,
    };
  }, [expenses]);

  const download = () => {
    const csv = toCsv(expenses ?? []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-report-${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Approved spend", icon: TrendingUp, node: <CurrencyDisplay value={stats.totalApproved} currency="INR" compact /> },
    { label: "Pending spend", icon: Clock, node: <CurrencyDisplay value={stats.totalPending} currency="INR" compact /> },
    { label: "Total claims", icon: Receipt, node: <span>{stats.count}</span> },
    { label: "Avg claim", icon: Wallet, node: <CurrencyDisplay value={stats.avg} currency="INR" compact /> },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Spend breakdowns across your team — export anytime"
        actions={
          <Button size="sm" onClick={download} disabled={!expenses?.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !expenses?.length ? (
        <EmptyState icon={Receipt} title="No data to report yet" description="Once expenses are submitted, spend breakdowns appear here." />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <k.icon className="h-4 w-4" /> {k.label}
                </div>
                <div className="text-xl font-semibold">{k.node}</div>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Spend by category">
              <div className="space-y-3">
                {stats.byCategory.map((c) => (
                  <div key={c.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{c.key}</span>
                      <CurrencyDisplay value={c.total} currency="INR" compact className="text-muted-foreground" />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (c.total / stats.maxCat) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top spenders">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 text-center font-medium">Claims</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byEmployee.slice(0, 8).map((e) => (
                    <tr key={e.key} className="border-b border-border/40 last:border-0">
                      <td className="py-2 font-medium">{e.key}</td>
                      <td className="py-2 text-center text-muted-foreground">{e.count}</td>
                      <td className="py-2 text-right"><CurrencyDisplay value={e.total} currency="INR" compact /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </div>

          <SectionCard title="All claims" description={`${stats.count} total`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Title</th>
                    <th className="pb-2 pr-3 font-medium">Submitter</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Submitted</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(expenses ?? []).slice(0, 50).map((e) => (
                    <tr key={e.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-3 font-medium">{e.ExpenseTitle}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{e.SubmitterName || e.SubmitterEmail}</td>
                      <td className="py-2 pr-3"><StatusBadge status={e.ApprovalStatus} /></td>
                      <td className="py-2 pr-3 text-muted-foreground">{formatDate(e.SubmissionDate)}</td>
                      <td className="py-2 text-right"><CurrencyDisplay value={expenseTotal(e)} currency="INR" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </>
  );
}
