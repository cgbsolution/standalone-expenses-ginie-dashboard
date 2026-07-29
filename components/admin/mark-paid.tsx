"use client";

import { useState } from "react";
import { Banknote, Check, Loader2, PlugZap } from "lucide-react";

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

/** Read-only marker for tenants whose payments post through SAP. */
export function SapPaymentBadge({ className }: { className?: string }) {
  return (
    <span
      title="This tenant is connected to SAP — payment is posted there, not recorded by hand."
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      <PlugZap className="h-3 w-3" /> Handled by SAP
    </span>
  );
}

/**
 * "Mark payment done" — only rendered when the tenant's super-admin has turned
 * on manual payment marking (`enabled`) and the viewer is allowed to act.
 *
 * When the tenant is connected to SAP, payment is posted there instead, so the
 * manual action is replaced by a read-only "Handled by SAP" marker.
 */
export function MarkPaidButton({
  expense,
  user,
  enabled,
  sapConnected = false,
  size = "sm",
  className,
}: {
  expense: MasterExpense;
  user: User | undefined;
  /** Tenant's `manualPaymentEnabled` flag. */
  enabled: boolean;
  /** Tenant's SAP integration is enabled — payment comes from SAP. */
  sapConnected?: boolean;
  size?: "sm" | "icon-sm";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const markPaid = useMarkExpensePaid();

  // A recorded payment always wins — show it however the tenant is wired.
  if (isPaid(expense)) return <PaidBadge expense={expense} className={className} />;
  // SAP posts the payment, so nobody records it by hand here.
  if (sapConnected) {
    return expense.ApprovalStatus === "Approved" ? (
      <SapPaymentBadge className={className} />
    ) : null;
  }
  if (!enabled || !canRecordPayment(user, expense)) return null;

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
