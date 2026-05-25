"use client";

import { Check, X } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";
import { useUpdateExpenseStatus } from "@/lib/hooks/use-expenses";

export function PendingApprovals({ expenses }: { expenses: MasterExpense[] }) {
  const pending = expenses.filter((e) => e.ApprovalStatus === "Pending");
  const { mutate } = useUpdateExpenseStatus();

  return (
    <SectionCard
      title="Pending approvals"
      description="Tap to approve or reject"
      action={
        pending.length > 0 ? (
          <span className="text-[11px] text-muted-foreground">{pending.length} waiting</span>
        ) : null
      }
    >
      {pending.length === 0 ? (
        <EmptyState
          title="Inbox zero"
          description="No expenses awaiting your decision right now."
        />
      ) : (
        <ul className="space-y-3">
          {pending.slice(0, 5).map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
            >
              <UserAvatar name={e.SubmitterName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.ExpenseTitle}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {e.SubmitterName} · {formatRelative(e.SubmissionDate)}
                </p>
              </div>
              <CurrencyDisplay value={e.TotalAmount} className="text-sm" />
              <div className="flex items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  aria-label="Reject"
                  onClick={() => mutate({ id: e.id, ApprovalStatus: "Rejected" })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-success hover:bg-success/10"
                  aria-label="Approve"
                  onClick={() => mutate({ id: e.id, ApprovalStatus: "Approved" })}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
