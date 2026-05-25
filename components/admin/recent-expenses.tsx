"use client";

import { SectionCard } from "@/components/shared/section-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatRelative } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";
import Link from "next/link";

interface Props {
  expenses: MasterExpense[];
  slug: string;
}

export function RecentExpenses({ expenses, slug }: Props) {
  return (
    <SectionCard
      title="Recent expenses"
      description="Last 10 submissions across your team"
      action={
        <Link
          href={`/t/${slug}/admin/expenses`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      }
      bodyClassName="px-0 pb-0"
    >
      {expenses.length === 0 ? (
        <div className="px-6 pb-6">
          <EmptyState title="No expenses yet" description="When your team submits expenses they'll appear here." />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.slice(0, 10).map((e) => (
              <TableRow key={e.id} className="cursor-pointer">
                <TableCell>
                  <p className="text-sm font-medium">{e.ExpenseTitle}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{e.ExpenseId}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar name={e.SubmitterName} size="sm" />
                    <span className="text-xs">{e.SubmitterName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.ApprovalStatus} />
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground" title={formatDate(e.SubmissionDate)}>
                    {formatRelative(e.SubmissionDate)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay value={e.TotalAmount} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
