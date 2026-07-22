"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PlanBadge, TenantStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CreateTenantSheet } from "@/components/super-admin/create-tenant-sheet";
import { TenantRowActions } from "@/components/super-admin/tenant-row-actions";
import { useTenants } from "@/lib/hooks/use-tenants";
import { formatRelative } from "@/lib/format";
import type { Tenant } from "@/types/tenant";

function exportTenantsCsv(tenants: Tenant[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Company", "Slug", "Admin email", "Plan", "Status", "Users", "MRR (INR)", "30-day volume (INR)", "Created"];
  const rows = tenants.map((t) =>
    [t.name, t.slug, t.adminEmail ?? "", t.plan ?? "", t.status, t.userCount, t.mrr ?? 0, t.monthlyExpenseVolume ?? 0, t.createdAt]
      .map(esc)
      .join(","),
  );
  const csv = [head.map(esc).join(","), ...rows].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "tenants.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function TenantsPage() {
  const router = useRouter();
  const { data: tenants, isLoading, error, refetch } = useTenants();

  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      {
        id: "company",
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex items-center gap-3">
              <UserAvatar name={t.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.adminEmail ?? "no admin assigned"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => <PlanBadge tier={row.original.plan} />,
        sortingFn: (a, b) => (a.original.plan ?? "").localeCompare(b.original.plan ?? ""),
      },
      {
        accessorKey: "userCount",
        header: "Users",
        cell: ({ row }) => (
          <span className="tabular text-sm">{row.original.userCount.toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <TenantStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "mrr",
        header: "MRR",
        cell: ({ row }) => (
          <CurrencyDisplay value={row.original.mrr ?? 0} compact className="text-sm" />
        ),
      },
      {
        accessorKey: "monthlyExpenseVolume",
        header: "30-day volume",
        cell: ({ row }) => (
          <CurrencyDisplay
            value={row.original.monthlyExpenseVolume ?? 0}
            compact
            className="text-sm text-muted-foreground"
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground" title={row.original.createdAt}>
            {formatRelative(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <TenantRowActions tenant={row.original} />,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Every company on the platform — search, sort, and drill into any one."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!tenants?.length}
              onClick={() => exportTenantsCsv(tenants ?? [])}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <CreateTenantSheet />
          </>
        }
      />

      <DataTable<Tenant>
        columns={columns}
        data={tenants ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        searchPlaceholder="Search tenants…"
        onRowClick={(t) => router.push(`/super-admin/tenants/${t.slug}`)}
        emptyTitle="No tenants yet"
        emptyDescription="When companies sign up they'll appear here. You can also create one manually."
        emptyAction={<CreateTenantSheet />}
      />
    </>
  );
}
