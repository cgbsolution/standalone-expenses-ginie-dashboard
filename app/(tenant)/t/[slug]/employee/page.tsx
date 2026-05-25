"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CheckCircle2, Clock, Receipt, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyExpenses } from "@/lib/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { formatCompactCurrency, formatCompactNumber, formatDate, formatRelative } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";

interface PageProps {
  params: { slug: string };
}

export default function EmployeeDashboardPage({ params }: PageProps) {
  const { slug } = params;
  const user = useAuthStore((s) => s.session?.user);
  const userEmail = user?.email ?? "";
  const { data: expenses, isLoading } = useMyExpenses(userEmail);

  const stats = useMemo(() => deriveStats(expenses ?? []), [expenses]);
  const monthSeries = useMemo(() => buildMonthlySeries(expenses ?? []), [expenses]);

  return (
    <>
      <WelcomeBanner firstName={user?.givenName ?? "there"} tenantSlug={slug} />

      <PageHeader
        title="My dashboard"
        description="Track your submissions, approvals, and reimbursements in one place"
        actions={
          <Button asChild size="sm">
            <Link href={`/t/${slug}/employee/expenses`}>
              <Receipt className="h-4 w-4" />
              See all expenses
            </Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KPICard
              label="This Month Spend"
              value={stats.monthSpend}
              format={(n) => formatCompactCurrency(n)}
              icon={Receipt}
              accent="primary"
            />
            <KPICard
              label="Pending"
              value={stats.pending}
              format={(n) => formatCompactNumber(n)}
              icon={Clock}
              accent="warning"
            />
            <KPICard
              label="Approved"
              value={stats.approved}
              format={(n) => formatCompactNumber(n)}
              icon={CheckCircle2}
              accent="success"
            />
            <KPICard
              label="Reimbursed (30d)"
              value={stats.reimbursed30d}
              format={(n) => formatCompactCurrency(n)}
              icon={Wallet}
              accent="violet"
            />
          </>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SpendChart isLoading={isLoading} data={monthSeries} className="lg:col-span-2" />
        <RecentSubmissions
          isLoading={isLoading}
          expenses={expenses ?? []}
          slug={slug}
        />
      </section>
    </>
  );
}

function WelcomeBanner({ firstName, tenantSlug }: { firstName: string; tenantSlug: string }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-card-light dark:shadow-card-dark">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
            {tenantSlug.toUpperCase()} workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Hi {firstName}, welcome back.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit new expenses from the ExpGenie mobile app. Track and review everything here.
          </p>
        </div>
      </div>
    </div>
  );
}

function SpendChart({
  isLoading,
  data,
  className,
}: {
  isLoading: boolean;
  data: { month: string; spend: number }[];
  className?: string;
}) {
  return (
    <SectionCard
      title="Your spending"
      description="Submitted amount per month (last 6 months)"
      className={className}
    >
      <div className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="No submissions yet" description="Once you submit your first expense it'll show up here." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.25 }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => formatCompactCurrency(v)}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#empGrad)"
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  );
}

function RecentSubmissions({
  isLoading,
  expenses,
  slug,
}: {
  isLoading: boolean;
  expenses: MasterExpense[];
  slug: string;
}) {
  const top = [...expenses]
    .sort((a, b) => new Date(b.SubmissionDate).getTime() - new Date(a.SubmissionDate).getTime())
    .slice(0, 5);

  return (
    <SectionCard
      title="Recent submissions"
      description="Your 5 most recent expenses"
      action={
        <Link
          href={`/t/${slug}/employee/expenses`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState title="No expenses yet" description="Submit one from the mobile app to see it here." />
      ) : (
        <ul className="space-y-3">
          {top.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.ExpenseTitle}</p>
                <p
                  className="truncate text-[11px] text-muted-foreground"
                  title={formatDate(e.SubmissionDate)}
                >
                  {formatRelative(e.SubmissionDate)}
                </p>
              </div>
              <CurrencyDisplay value={e.TotalAmount} className="text-sm" />
              <StatusBadge status={e.ApprovalStatus} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function deriveStats(expenses: MasterExpense[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;

  let monthSpend = 0;
  let pending = 0;
  let approved = 0;
  let reimbursed30d = 0;

  for (const e of expenses) {
    const submittedAt = new Date(e.SubmissionDate).getTime();
    if (submittedAt >= monthStart) monthSpend += e.TotalAmount;
    if (e.ApprovalStatus === "Pending") pending += 1;
    if (e.ApprovalStatus === "Approved") {
      approved += 1;
      const approvedAt = e.ApprovedAt ? new Date(e.ApprovedAt).getTime() : submittedAt;
      if (approvedAt >= thirtyDaysAgo) reimbursed30d += e.TotalAmount;
    }
  }
  return { monthSpend, pending, approved, reimbursed30d };
}

function buildMonthlySeries(expenses: MasterExpense[]): { month: string; spend: number }[] {
  const months: { key: string; label: string; spend: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({ key, label, spend: 0 });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const e of expenses) {
    const d = new Date(e.SubmissionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.spend += e.TotalAmount;
  }
  return months.map(({ label, spend }) => ({ month: label, spend }));
}
