"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExpenseDetailDrawer } from "@/components/admin/expense-detail-drawer";
import { PaidBadge, isPaid } from "@/components/admin/mark-paid";
import { Button } from "@/components/ui/button";
import { useTenantExpenses } from "@/lib/hooks/use-expenses";
import { useConfig } from "@/lib/hooks/use-settings";
import { useIntegrations } from "@/lib/hooks/use-integrations";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatRelative, toAmount } from "@/lib/format";
import { toast } from "sonner";
import type { MasterExpense } from "@/types/expense";

export default function ExpensesPage({ params }: { params: { slug: string } }) {
  // Tenant-admin: every submission across all users in the tenant.
  const { data: expenses, isLoading, error, refetch } = useTenantExpenses(params.slug);
  const user = useAuthStore((s) => s.session?.user);
  // Payment: SAP-connected tenants get status from SAP; the rest can have the
  // manual tick, which a super-admin enables per tenant.
  const { data: tenantConfig } = useConfig(params.slug);
  const { data: integrations } = useIntegrations(params.slug);
  const manualPaymentEnabled = !!tenantConfig?.config.manualPaymentEnabled;
  const sapConnected = !!integrations?.sap.enabled;
  const [detailId, setDetailId] = useState<string | null>(null);
  const activeExpense = detailId ? (expenses ?? []).find((e) => e.id === detailId) ?? null : null;

  const columns = useMemo<ColumnDef<MasterExpense, unknown>[]>(
    () => [
      {
        accessorKey: "ExpenseTitle",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.ExpenseTitle}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{row.original.ExpenseId}</p>
          </div>
        ),
      },
      {
        accessorKey: "SubmitterName",
        header: "Submitter",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.original.SubmitterName} size="sm" />
            <span className="text-xs">{row.original.SubmitterName}</span>
          </div>
        ),
      },
      {
        accessorKey: "ApprovalStatus",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={row.original.ApprovalStatus} />
            {isPaid(row.original) ? <PaidBadge expense={row.original} /> : null}
          </div>
        ),
      },
      {
        accessorKey: "SubmissionDate",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground" title={formatDate(row.original.SubmissionDate)}>
            {formatRelative(row.original.SubmissionDate)}
          </span>
        ),
      },
      {
        accessorKey: "TotalAmount",
        header: "Amount",
        cell: ({ row }) => {
          const t = toAmount(row.original.TotalAmount);
          const amount = t > 0
            ? t
            : (row.original.ExpenseData ?? []).reduce((s, inv) => s + toAmount(inv.InvoiceAmount), 0);
          return <CurrencyDisplay value={amount} currency="INR" />;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="View details"
            onClick={(e) => {
              e.stopPropagation();
              setDetailId(row.original.id);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Every submission across your team — filter, drill in, export"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("CSV export not wired yet")}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      <DataTable<MasterExpense>
        columns={columns}
        data={expenses ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        onRowClick={(row) => setDetailId(row.id)}
        searchPlaceholder="Search title, ID, submitter…"
        emptyTitle="No expenses yet"
        emptyDescription="Submit an expense from the mobile app and it'll appear here."
      />

      <ExpenseDetailDrawer
        expense={activeExpense}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        user={user}
        manualPaymentEnabled={manualPaymentEnabled}
        sapConnected={sapConnected}
      />
    </>
  );
}
