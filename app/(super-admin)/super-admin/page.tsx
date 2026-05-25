"use client";

import { Building2, DollarSign, Receipt, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSuperAdminOverview } from "@/lib/hooks/use-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/format";
import { TenantGrowthChart } from "@/components/super-admin/tenant-growth-chart";
import { RevenueChart } from "@/components/super-admin/revenue-chart";
import { RecentSignups } from "@/components/super-admin/recent-signups";
import { SystemHealth } from "@/components/super-admin/system-health";
import { TopTenants } from "@/components/super-admin/top-tenants";

const KPI_FORMATTERS = [
  (n: number) => formatCompactNumber(n),
  (n: number) => formatCompactNumber(n),
  (n: number) => formatCompactCurrency(n),
  (n: number) => formatCompactNumber(n),
];
const KPI_ICONS = [Building2, Users, DollarSign, Receipt];
const KPI_ACCENTS = ["primary", "cyan", "violet", "success"] as const;

export default function SuperAdminOverviewPage() {
  const { data, isLoading } = useSuperAdminOverview();
  const firstName = useAuthStore((s) => s.session?.user.givenName ?? "there");

  return (
    <>
      <PageHeader
        title={
          <span>
            Welcome back, <span className="gradient-text">{firstName}</span>
          </span>
        }
        description="Cross-tenant snapshot of the ExpGenie platform"
        actions={
          <>
            <Button variant="outline" size="sm">
              Export report
            </Button>
            <Button size="sm">New tenant</Button>
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
            <TenantGrowthChart data={data.tenantGrowth} />
            <RevenueChart data={data.revenueByPlan} />
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
              <RecentSignups tenants={data.recentSignups} />
            </div>
            <div className="space-y-4">
              <SystemHealth metrics={data.systemHealth} />
            </div>
          </>
        )}
      </section>

      <section className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-72" />
        ) : (
          <TopTenants tenants={data.topTenants} />
        )}
      </section>
    </>
  );
}
