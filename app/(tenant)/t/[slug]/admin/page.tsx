"use client";

import { CalendarDays, Plus, Receipt, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAdminDashboard } from "@/lib/hooks/use-dashboard";
import { useApproverExpenses } from "@/lib/hooks/use-expenses";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/format";
import { SpendingTrend } from "@/components/admin/spending-trend";
import { CategoryDonut } from "@/components/admin/category-donut";
import { BudgetProgress } from "@/components/admin/budget-progress";
import { PendingApprovals } from "@/components/admin/pending-approvals";
import { RecentExpenses } from "@/components/admin/recent-expenses";
import { useAuthStore } from "@/stores/auth-store";

const KPI_FORMATTERS = [
  (n: number) => formatCompactCurrency(n),
  (n: number) => formatCompactNumber(n),
  (n: number) => formatCompactCurrency(n),
  (n: number) => formatCompactCurrency(n),
];
const KPI_ICONS = [Receipt, ShieldCheck, TrendingUp, Sparkles];
const KPI_ACCENTS = ["primary", "warning", "success", "violet"] as const;

interface PageProps {
  params: { slug: string };
}

export default function TenantAdminDashboardPage({ params }: PageProps) {
  const { slug } = params;
  const userEmail = useAuthStore((s) => s.session?.user.email ?? "");

  const { data, isLoading } = useAdminDashboard(slug);
  const { data: expenses } = useApproverExpenses(userEmail);

  return (
    <>
      <WelcomeBanner slug={slug} />

      <PageHeader
        title="Dashboard"
        description="Track spend, approvals and reimbursements at a glance"
        actions={
          <>
            <Button variant="outline" size="sm">
              <CalendarDays className="h-4 w-4" />
              May 2026
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New expense
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : data?.kpis.map((k, i) => (
              <KPICard
                key={k.label}
                label={k.label}
                value={k.value}
                deltaPct={k.deltaPct}
                spark={k.spark}
                format={KPI_FORMATTERS[i]}
                icon={KPI_ICONS[i]}
                accent={KPI_ACCENTS[i]}
              />
            ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-[340px] lg:col-span-2" />
            <Skeleton className="h-[340px]" />
          </>
        ) : (
          <>
            <SpendingTrend data={data.spendTrend} />
            <CategoryDonut categories={data.categories} />
          </>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-[360px] lg:col-span-2" />
            <Skeleton className="h-[360px]" />
          </>
        ) : (
          <>
            <div className="lg:col-span-2">
              <BudgetProgress categories={data.categories} />
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

function WelcomeBanner({ slug }: { slug: string }) {
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
            17 expenses need your decision — average pending age 1d 4h. Stay sharp.
          </p>
        </div>
        <Button size="sm" variant="default" className="shrink-0">
          Review approvals
        </Button>
      </div>
    </div>
  );
}
