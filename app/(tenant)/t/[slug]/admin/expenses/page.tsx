"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAllExpenses } from "@/lib/hooks/use-expenses";
import { formatDate, formatRelative } from "@/lib/format";
import { toast } from "sonner";
import type { MasterExpense } from "@/types/expense";

export default function ExpensesPage() {
  // Team-wide: every submission across the company, not just what this admin approves.
  const { data: expenses, isLoading, error, refetch } = useAllExpenses();

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
        cell: ({ row }) => <StatusBadge status={row.original.ApprovalStatus} />,
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
        cell: ({ row }) => <CurrencyDisplay value={row.original.TotalAmount} />,
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
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("CSV export not wired yet")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => toast.info("New expense form not wired yet — submit via mobile for now")}
            >
              <Plus className="h-4 w-4" />
              New expense
            </Button>
          </>
        }
      />

      <DataTable<MasterExpense>
        columns={columns}
        data={expenses ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        searchPlaceholder="Search title, ID, submitter…"
        emptyTitle="No expenses yet"
        emptyDescription="When your team submits expenses, they'll appear here."
      />
    </>
  );
}
