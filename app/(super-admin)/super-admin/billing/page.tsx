"use client";

import { useMemo } from "react";
import { TrendingUp, Wallet, CheckCircle2, Ban } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PlanBadge, TenantStatusBadge } from "@/components/shared/status-badge";
import { useTenants } from "@/lib/hooks/use-tenants";

export default function BillingPage() {
  const { data: tenants, isLoading } = useTenants();

  const stats = useMemo(() => {
    const list = tenants ?? [];
    const mrr = list.reduce((s, t) => s + (t.mrr || 0), 0);
    return {
      count: list.length,
      mrr,
      arr: mrr * 12,
      active: list.filter((t) => t.status === "active").length,
      churned: list.filter((t) => t.status === "churned").length,
      sorted: [...list].sort((a, b) => (b.mrr || 0) - (a.mrr || 0)),
    };
  }, [tenants]);

  const kpis = [
    { label: "MRR", icon: Wallet, node: <CurrencyDisplay value={stats.mrr} currency="INR" compact /> },
    { label: "ARR (run-rate)", icon: TrendingUp, node: <CurrencyDisplay value={stats.arr} currency="INR" compact /> },
    { label: "Active tenants", icon: CheckCircle2, node: <span>{stats.active}</span> },
    { label: "Churned", icon: Ban, node: <span>{stats.churned}</span> },
  ];

  return (
    <>
      <PageHeader title="Billing" description="Recurring revenue and plan mix across every tenant" />

      <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Live figures from tenant plans. Invoice generation and Stripe/Razorpay collection are a planned add-on.
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !tenants?.length ? (
        <EmptyState icon={Wallet} title="No tenants yet" description="Revenue appears here once tenants are onboarded." />
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

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Tenant</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-center font-medium">Users</th>
                  <th className="px-4 py-2.5 text-right font-medium">MRR</th>
                </tr>
              </thead>
              <tbody>
                {stats.sorted.map((t) => (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">/{t.slug}</p>
                    </td>
                    <td className="px-4 py-2.5"><PlanBadge tier={t.plan} /></td>
                    <td className="px-4 py-2.5"><TenantStatusBadge status={t.status} /></td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.userCount}</td>
                    <td className="px-4 py-2.5 text-right"><CurrencyDisplay value={t.mrr || 0} currency="INR" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
