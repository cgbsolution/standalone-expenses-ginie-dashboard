"use client";

import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/lib/hooks/use-tenants";
import { PlanBadge, TenantStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: { id: string };
}

export default function TenantDetailPage({ params }: PageProps) {
  const { data: tenant, isLoading } = useTenant(params.id);

  return (
    <>
      <Link
        href="/super-admin/tenants"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All tenants
      </Link>

      {isLoading ? (
        <Skeleton className="mb-6 h-24 w-full" />
      ) : tenant ? (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-card-light dark:shadow-card-dark sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={tenant.name} size="lg" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{tenant.name}</h2>
              <p className="text-xs text-muted-foreground">
                /{tenant.slug} · {tenant.userCount} users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlanBadge tier={tenant.plan} />
            <TenantStatusBadge status={tenant.status} />
            <Button size="sm" variant="outline">
              Impersonate
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader title="Tenant not found" description={`No tenant with slug "${params.id}"`} />
      )}

      <ComingSoon
        icon={Building2}
        title="Tenant detail tabs"
        bullets={[
          "Overview — KPIs scoped to this tenant",
          "Users — the tenant's employees with role and grade",
          "Billing — invoices, payment method, plan changes",
          "Activity — audit trail filtered to this tenant",
          "Settings — branding, currency, fiscal year, custom domain",
        ]}
      />
    </>
  );
}
