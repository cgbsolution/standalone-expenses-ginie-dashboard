"use client";

import { useState } from "react";
import { Banknote, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMarkExpensePaid } from "@/lib/hooks/use-expenses";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";
import type { MasterExpense } from "@/types/expense";

/**
 * Who may record a manual payment: the finance approver left on the expense
 * after final approval, plus tenant admins covering for them. Mirrors
 * `canMarkPaid` in expenses-backend/routes/masterExpense.js — the server is the
 * real gate, this only decides whether to render the button.
 */
export function canRecordPayment(user: User | undefined, expense: MasterExpense): boolean {
  if (!user?.email) return false;
  if (expense.ApprovalStatus !== "Approved") return false;
  if (user.role === "admin" || user.role === "super_admin") return true;
  return user.email.toLowerCase() === (expense.ApproverEmail || "").toLowerCase();
}

export function isPaid(expense: MasterExpense): boolean {
  return expense.PaymentStatus === "Paid";
}

/** Small "Paid" pill with the reference on hover. */
export function PaidBadge({ expense, className }: { expense: MasterExpense; className?: string }) {
  const ref = expense.PaymentInfo?.Reference?.trim();
  const paidAt = expense.PaymentInfo?.PaidAt;
  return (
    <span
      title={
        [
          paidAt ? `Paid ${formatDate(paidAt, "MMM d, yyyy")}` : "Paid",
          ref ? `Ref ${ref}` : "",
          expense.PaymentInfo?.PaidBy ? `by ${expense.PaymentInfo.PaidBy}` : "",
        ]
          .filter(Boolean)
          .join(" · ") || undefined
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success",
        className,
      )}
    >
      <Check className="h-3 w-3" /> Paid
    </span>
  );
}

/**
 * "Mark payment done" — only rendered when the tenant's super-admin has turned
 * on manual payment marking (`enabled`) and the viewer is allowed to act.
 */
export function MarkPaidButton({
  expense,
  user,
  enabled,
  size = "sm",
  className,
}: {
  expense: MasterExpense;
  user: User | undefined;
  /** Tenant's `manualPaymentEnabled` flag. */
  enabled: boolean;
  size?: "sm" | "icon-sm";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const markPaid = useMarkExpensePaid();

  if (!enabled || !canRecordPayment(user, expense)) return null;
  if (isPaid(expense)) return <PaidBadge expense={expense} className={className} />;

  const submit = async () => {
    try {
      await markPaid.mutateAsync({
        id: expense.id,
        UpdatedBy: user!.email,
        PaymentReference: reference.trim() || undefined,
        PaymentNote: note.trim() || undefined,
      });
      setOpen(false);
      setReference("");
      setNote("");
    } catch {
      // useMarkExpensePaid already surfaced the error; keep the dialog open so
      // the reference the user typed isn't lost.
    }
  };

  return (
    <>
      <Button
        size={size}
        variant="outline"
        className={cn("text-success hover:bg-success/10", className)}
        onClick={() => setOpen(true)}
      >
        <Banknote className="h-3.5 w-3.5" />
        {size === "icon-sm" ? null : "Mark payment done"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Confirms that <span className="font-medium">{expense.ExpenseTitle}</span> has been paid
              to {expense.SubmitterName || expense.SubmitterEmail}. This is a manual record — it does
              not move money.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="payment-ref">Reference (UTR / cheque / voucher no.)</Label>
              <Input
                id="payment-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-note">Note</Label>
              <Input
                id="payment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={markPaid.isPending}>
              {markPaid.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Banknote className="h-3.5 w-3.5" />
              )}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
