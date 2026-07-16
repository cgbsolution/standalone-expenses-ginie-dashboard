"use client";

import { useMemo } from "react";
import { Building2, Users2, Wallet, Receipt } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { useTenants } from "@/lib/hooks/use-tenants";
import { useAllExpenses } from "@/lib/hooks/use-expenses";
import type { MasterExpense } from "@/types/expense";

const PLANS = ["starter", "growth", "scale", "enterprise"] as const;

function bar(count: number, max: number) {
  return `${Math.max(4, (count / (max || 1)) * 100)}%`;
}

export default function AnalyticsPage() {
  const { data: tenants, isLoading } = useTenants();
  const { data: expenses } = useAllExpenses();

  const stats = useMemo(() => {
    const list = tenants ?? [];
    const planMix = PLANS.map((p) => ({ plan: p, count: list.filter((t) => (t.plan ?? "growth") === p).length }));
    const maxPlan = Math.max(1, ...planMix.map((p) => p.count));
    const catMap = new Map<string, number>();
    for (const e of expenses ?? []) {
      const c = (e as MasterExpense).ExpenseData?.[0]?.Category || "Uncategorised";
      catMap.set(c, (catMap.get(c) || 0) + (Number((e as MasterExpense).TotalAmount) || 0));
    }
    const categories = Array.from(catMap.entries()).map(([key, total]) => ({ key, total })).sort((a, b) => b.total - a.total).slice(0, 6);
    const maxCat = Math.max(1, ...categories.map((c) => c.total));
    return {
      tenants: list.length,
      users: list.reduce((s, t) => s + (t.userCount || 0), 0),
      mrr: list.reduce((s, t) => s + (t.mrr || 0), 0),
      volume: list.reduce((s, t) => s + (t.monthlyExpenseVolume || 0), 0),
      planMix, maxPlan, categories, maxCat,
    };
  }, [tenants, expenses]);

  const kpis = [
    { label: "Tenants", icon: Building2, node: <span>{stats.tenants}</span> },
    { label: "Total users", icon: Users2, node: <span>{stats.users}</span> },
    { label: "Platform MRR", icon: Wallet, node: <CurrencyDisplay value={stats.mrr} currency="USD" compact /> },
    { label: "30-day expense volume", icon: Receipt, node: <CurrencyDisplay value={stats.volume} currency="INR" compact /> },
  ];

  return (
    <>
      <PageHeader title="Analytics" description="Platform-wide adoption and spend across every tenant" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !tenants?.length ? (
        <EmptyState icon={Building2} title="No data yet" description="Analytics populate as tenants onboard and submit expenses." />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><k.icon className="h-4 w-4" /> {k.label}</div>
                <div className="text-xl font-semibold">{k.node}</div>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Plan mix" description="Tenants by plan tier">
              <div className="space-y-3">
                {stats.planMix.map((p) => (
                  <div key={p.plan}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{p.plan}</span>
                      <span className="text-muted-foreground">{p.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: bar(p.count, stats.maxPlan) }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top expense categories" description="Across all tenants">
              {stats.categories.length ? (
                <div className="space-y-3">
                  {stats.categories.map((c) => (
                    <div key={c.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{c.key}</span>
                        <CurrencyDisplay value={c.total} currency="INR" compact className="text-muted-foreground" />
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: bar(c.total, stats.maxCat) }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No expense data yet.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </>
  );
}
