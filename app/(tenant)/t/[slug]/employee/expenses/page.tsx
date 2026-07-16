"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { ExpenseDetailDrawer } from "@/components/admin/expense-detail-drawer";
import { Button } from "@/components/ui/button";
import { useMyExpenses } from "@/lib/hooks/use-expenses";
import { expenseTotal } from "@/lib/expense";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatRelative } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";

export default function MyExpensesPage() {
  const userEmail = useAuthStore((s) => s.session?.user.email ?? "");
  const { data: expenses, isLoading, error, refetch } = useMyExpenses(userEmail);
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
        accessorKey: "ApproverEmail",
        header: "Approver",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.ApproverEmail}</span>
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
        cell: ({ row }) => <CurrencyDisplay value={expenseTotal(row.original)} />,
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
        title="My expenses"
        description="Every expense you've submitted — track status, drill in, follow up"
      />

      <DataTable<MasterExpense>
        columns={columns}
        data={expenses ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        onRowClick={(row) => setDetailId(row.id)}
        searchPlaceholder="Search title, expense ID, approver…"
        emptyTitle="No expenses yet"
        emptyDescription="Submit your first expense from the ExpGenie mobile app to see it here."
      />

      <ExpenseDetailDrawer
        expense={activeExpense}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </>
  );
}
