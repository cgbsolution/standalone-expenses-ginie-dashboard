"use client";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgingIndicator, isOverdue } from "./aging-indicator";
import { TieredAmount } from "./amount-tier";
import { cn } from "@/lib/utils";
import type { MasterExpense } from "@/types/expense";

interface ApprovalCardProps {
  expense: MasterExpense;
  selected: boolean;
  onSelectedChange: (next: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onOpen: () => void;
  disabled?: boolean;
}

export function ApprovalCard({
  expense,
  selected,
  onSelectedChange,
  onApprove,
  onReject,
  onOpen,
  disabled,
}: ApprovalCardProps) {
  const overdue = expense.ApprovalStatus === "Pending" && isOverdue(expense.SubmissionDate);

  return (
    <li
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border bg-card/60 p-4 backdrop-blur-xl transition-all",
        "shadow-card-light dark:shadow-card-dark",
        selected
          ? "border-primary/50 ring-1 ring-primary/30"
          : overdue
            ? "border-destructive/30"
            : "border-border hover:bg-secondary/30",
      )}
    >
      {overdue ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-destructive to-rose-500"
        />
      ) : null}

      <label
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelectedChange(e.target.checked)}
          aria-label={`Select ${expense.ExpenseTitle}`}
          className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary focus:ring-1 focus:ring-ring focus:ring-offset-0"
        />
      </label>

      <UserAvatar name={expense.SubmitterName} size="sm" />

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{expense.ExpenseTitle}</p>
          <span className="font-mono text-[10px] text-muted-foreground">{expense.ExpenseId}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{expense.SubmitterName}</span>
          <AgingIndicator submittedAt={expense.SubmissionDate} />
        </div>
      </button>

      <div className="flex items-center gap-3">
        <TieredAmount amount={expense.TotalAmount ?? sumInvoices(expense)} />
        {expense.ApprovalStatus === "Pending" ? (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Reject"
              className="text-destructive hover:bg-destructive/10"
              disabled={disabled}
              onClick={onReject}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Approve"
              className="text-success hover:bg-success/10"
              disabled={disabled}
              onClick={onApprove}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <StatusBadge status={expense.ApprovalStatus} />
        )}
      </div>
    </li>
  );
}

function sumInvoices(e: MasterExpense): number {
  if (!Array.isArray(e.ExpenseData)) return 0;
  return e.ExpenseData.reduce((s, inv) => s + (Number(inv.InvoiceAmount) || 0), 0);
}
