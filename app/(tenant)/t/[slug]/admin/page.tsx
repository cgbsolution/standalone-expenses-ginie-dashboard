"use client";

import { useMemo } from "react";
import { CalendarDays, Plus, Receipt, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useApproverExpenses } from "@/lib/hooks/use-expenses";
import { useCategories } from "@/lib/hooks/use-categories";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { SpendingTrend } from "@/components/admin/spending-trend";
import { CategoryDonut } from "@/components/admin/category-donut";
import { BudgetProgress } from "@/components/admin/budget-progress";
import { PendingApprovals } from "@/components/admin/pending-approvals";
import { RecentExpenses } from "@/components/admin/recent-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { expenseTotal } from "@/lib/expense";
import type { MasterExpense, Category } from "@/types/expense";
import type { SpendTrendPoint } from "@/lib/mocks/dashboard";

interface PageProps {
  params: { slug: string };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PALETTE = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

// Last 30 days of real submissions (spend) and approvals (reimbursed).
function buildTrend(expenses: MasterExpense[]): SpendTrendPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - 29 * DAY_MS;
  const days: SpendTrendPoint[] = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(start + i * DAY_MS).toISOString(),
    spend: 0,
    reimbursed: 0,
  }));
  const bucket = (iso?: string) => {
    if (!iso) return -1;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return -1;
    d.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - start) / DAY_MS);
  };
  for (const e of expenses) {
    const amt = expenseTotal(e);
    const submitted = days[bucket(e.SubmissionDate)];
    if (submitted) submitted.spend += amt;
    const approved = days[bucket(e.ApprovedAt)];
    if (approved) approved.reimbursed += amt;
  }
  return days;
}

// Real spend per category, merged with the configured category budgets.
function buildCategories(expenses: MasterExpense[], defined: { id: string; name: string; color: string; icon: string; monthlyBudget: number }[]): Category[] {
  const spent = new Map<string, number>();
  for (const e of expenses) {
    const name = e.ExpenseData?.[0]?.Category || "Uncategorised";
    spent.set(name, (spent.get(name) || 0) + expenseTotal(e));
  }
  const out: Category[] = defined.map((c) => ({
    id: c.id, name: c.name, color: c.color, icon: c.icon,
    monthlyBudget: c.monthlyBudget, spent: spent.get(c.name) || 0,
  }));
  let i = 0;
  for (const [name, amount] of spent) {
    if (!defined.some((c) => c.name === name)) {
      out.push({ id: name, name, color: PALETTE[(defined.length + i++) % PALETTE.length] ?? "#6366F1", icon: "folder", monthlyBudget: 0, spent: amount });
    }
  }
  return out.sort((a, b) => b.spent - a.spent);
}

export default function TenantAdminDashboardPage({ params }: PageProps) {
  const { slug } = params;
  const userEmail = useAuthStore((s) => s.session?.user.email ?? "");

  const { data: expenses, isLoading } = useApproverExpenses(userEmail);
  const { data: definedCategories } = useCategories(slug);

  const stats = useMemo(() => {
    const list = expenses ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thirtyAgo = Date.now() - 30 * DAY_MS;
    const pending = list.filter((e) => e.ApprovalStatus === "Pending");
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, e) => s + expenseTotal(e), 0),
      monthVolume: list
        .filter((e) => new Date(e.SubmissionDate).getTime() >= monthStart)
        .reduce((s, e) => s + expenseTotal(e), 0),
      approved30d: list
        .filter((e) => e.ApprovalStatus === "Approved" && e.ApprovedAt && new Date(e.ApprovedAt).getTime() >= thirtyAgo)
        .reduce((s, e) => s + expenseTotal(e), 0),
      trend: buildTrend(list),
      categories: buildCategories(list, definedCategories ?? []),
    };
  }, [expenses, definedCategories]);

  const kpis = [
    { label: "This month volume", icon: Receipt, node: <CurrencyDisplay value={stats.monthVolume} compact /> },
    { label: "Pending approvals", icon: ShieldCheck, node: <span>{stats.pendingCount}</span> },
    { label: "Pending amount", icon: Sparkles, node: <CurrencyDisplay value={stats.pendingAmount} compact /> },
    { label: "Approved (30d)", icon: TrendingUp, node: <CurrencyDisplay value={stats.approved30d} compact /> },
  ];

  return (
    <>
      <WelcomeBanner slug={slug} pending={stats.pendingCount} />

      <PageHeader
        title="Dashboard"
        description="Track spend, approvals and reimbursements at a glance"
        actions={
          <Button variant="outline" size="sm">
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <k.icon className="h-4 w-4" /> {k.label}
                </div>
                <div className="text-xl font-semibold">{k.node}</div>
              </div>
            ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[340px] lg:col-span-2" />
            <Skeleton className="h-[340px]" />
          </>
        ) : (
          <>
            <SpendingTrend data={stats.trend} />
            <CategoryDonut categories={stats.categories} />
          </>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[360px] lg:col-span-2" />
            <Skeleton className="h-[360px]" />
          </>
        ) : (
          <>
            <div className="lg:col-span-2">
              <BudgetProgress categories={stats.categories.filter((c) => c.monthlyBudget > 0)} />
            </div>
            <PendingApprovals expenses={expenses ?? []} />
          </>
        )}
      </section>

      <section className="mt-6">
        <RecentExpenses expenses={expenses ?? []} slug={slug} />
      </section>
    </>
  );
}

function WelcomeBanner({ slug, pending }: { slug: string; pending: number }) {
  const name = useAuthStore((s) => s.session?.user.givenName ?? "there");
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-card-light dark:shadow-card-dark">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
            {slug.toUpperCase()} workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Hey {name}, here's your day.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending > 0
              ? `${pending} ${pending === 1 ? "expense needs" : "expenses need"} your decision. Stay sharp.`
              : "No approvals pending — you're all caught up."}
          </p>
        </div>
        <Button size="sm" variant="default" className="shrink-0">
          Review approvals
        </Button>
      </div>
    </div>
  );
}
