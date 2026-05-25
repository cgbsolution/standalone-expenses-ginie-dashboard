"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Badge } from "@/components/ui/badge";
import { useMyExpenses } from "@/lib/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatRelative } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";

export default function ReimbursementsPage() {
  const userEmail = useAuthStore((s) => s.session?.user.email ?? "");
  // Approved expenses → eligible for reimbursement.
  const { data: expenses, isLoading, error, refetch } = useMyExpenses(userEmail, "Approved");

  const totalApproved = (expenses ?? []).reduce((s, e) => s + e.TotalAmount, 0);

  const columns = useMemo<ColumnDef<MasterExpense, unknown>[]>(
    () => [
      {
        accessorKey: "ExpenseTitle",
        header: "Expense",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.ExpenseTitle}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{row.original.ExpenseId}</p>
          </div>
        ),
      },
      {
        accessorKey: "ApprovedAt",
        header: "Approved",
        cell: ({ row }) => {
          const at = row.original.ApprovedAt ?? row.original.LastActionAt ?? row.original.SubmissionDate;
          return (
            <span className="text-xs text-muted-foreground" title={formatDate(at)}>
              {formatRelative(at)}
            </span>
          );
        },
      },
      {
        id: "payout",
        header: "Payout",
        cell: () => (
          <Badge variant="warning">Awaiting payout</Badge>
        ),
      },
      {
        accessorKey: "TotalAmount",
        header: "Amount",
        cell: ({ row }) => <CurrencyDisplay value={row.original.TotalAmount} />,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Reimbursements"
        description={
          totalApproved > 0
            ? `${(expenses ?? []).length} approved expenses · `
            : "Track every approved expense and its payout status"
        }
        actions={
          totalApproved > 0 ? (
            <div className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs backdrop-blur-xl">
              <span className="text-muted-foreground">Approved total · </span>
              <CurrencyDisplay value={totalApproved} className="text-sm" />
            </div>
          ) : null
        }
      />

      <DataTable<MasterExpense>
        columns={columns}
        data={expenses ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        searchPlaceholder="Search approved expenses…"
        emptyTitle="No reimbursements yet"
        emptyDescription="When an expense is approved, it'll appear here ready for payout."
      />

      <p className="mt-4 text-[11px] text-muted-foreground">
        Payout status is illustrative. The real reimbursement workflow (ACH, payroll, finance
        export) will be wired in a future release.
      </p>
    </>
  );
}
