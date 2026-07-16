"use client";

import Link from "next/link";
import { ArrowLeft, Users2, Wallet, Receipt, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlanBadge, TenantStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { useTenant } from "@/lib/hooks/use-tenants";
import { useUsers } from "@/lib/hooks/use-users";
import { formatDate } from "@/lib/format";

interface PageProps {
  params: { id: string };
}

export default function TenantDetailPage({ params }: PageProps) {
  const { data: tenant, isLoading } = useTenant(params.id);
  const { data: users, isLoading: usersLoading } = useUsers({ tenant: tenant?.slug });

  return (
    <>
      <Link href="/super-admin/tenants" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> All tenants
      </Link>

      {isLoading ? (
        <Skeleton className="mb-6 h-24 w-full" />
      ) : tenant ? (
        <>
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-card-light dark:shadow-card-dark sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar name={tenant.name} size="lg" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{tenant.name}</h2>
                <p className="text-xs text-muted-foreground">/{tenant.slug} · {tenant.userCount} users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PlanBadge tier={tenant.plan} />
              <TenantStatusBadge status={tenant.status} />
              <Button size="sm" variant="outline">Impersonate</Button>
            </div>
          </div>

          <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icon={Users2} label="Users" node={<span>{tenant.userCount}</span>} />
            <Kpi icon={Wallet} label="MRR" node={<CurrencyDisplay value={tenant.mrr || 0} currency="INR" compact />} />
            <Kpi icon={Receipt} label="30-day volume" node={<CurrencyDisplay value={tenant.monthlyExpenseVolume || 0} currency="INR" compact />} />
            <Kpi icon={CalendarDays} label="Created" node={<span className="text-base">{formatDate(tenant.createdAt)}</span>} />
          </section>

          <div className="rounded-xl border border-border">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold">Users</p>
              {tenant.adminEmail ? <p className="text-xs text-muted-foreground">Admin: {tenant.adminName || tenant.adminEmail}</p> : null}
            </div>
            {usersLoading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : !users?.length ? (
              <EmptyState icon={Users2} title="No users" description="This tenant has no employees yet." className="border-0" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">Grade</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={u.displayName} size="sm" />
                          <div>
                            <p className="font-medium">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><Badge variant="secondary" className="capitalize">{u.role}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.grade || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.department || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <PageHeader title="Tenant not found" description={`No tenant with slug "${params.id}"`} />
      )}
    </>
  );
}

function Kpi({ icon: Icon, label, node }: { icon: React.ComponentType<{ className?: string }>; label: string; node: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className="text-xl font-semibold">{node}</div>
    </div>
  );
}
