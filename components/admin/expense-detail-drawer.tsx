"use client";

import { useState } from "react";
import { Check, X, FileText, Loader2, Paperclip, CheckCircle2, Clock, XCircle, Circle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { invoiceFiles, type AttachmentRef } from "@/lib/expense";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { TieredAmount } from "@/components/admin/amount-tier";
import { formatDate, formatRelative, toAmount } from "@/lib/format";
import apiClient from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { MasterExpense } from "@/types/expense";

function expenseTotal(e: MasterExpense): number {
  const t = toAmount(e.TotalAmount);
  return t > 0 ? t : (e.ExpenseData ?? []).reduce((s, inv) => s + toAmount(inv.InvoiceAmount), 0);
}

type StageState = "done" | "current" | "pending" | "rejected";
interface Stage { key: string; label: string; state: StageState; at?: string }

// Derive the workflow position from status + approval history:
// Submitted → Manager approval → Finance approval → Payment (or Rejected).
function computeStages(e: MasterExpense): Stage[] {
  const history = Array.isArray(e.ApprovalHistory) ? e.ApprovalHistory : [];
  const forwardEntry = history.find(
    (h) => /finance/i.test(h.action_status || "") || /forwarded to finance/i.test(h.comments || ""),
  );
  const forwarded = !!forwardEntry;
  const rejectedAt = e.RejectionInfo?.RejectedAt;
  const status = e.ApprovalStatus;

  const submitted: Stage = { key: "submitted", label: "Submitted", state: "done", at: e.SubmissionDate || history[0]?.at };
  let manager: Stage;
  let finance: Stage;
  let payment: Stage;

  if (status === "Rejected") {
    manager = forwarded
      ? { key: "manager", label: "Manager approval", state: "done", at: forwardEntry?.at }
      : { key: "manager", label: "Manager approval", state: "rejected", at: rejectedAt };
    finance = forwarded
      ? { key: "finance", label: "Finance approval", state: "rejected", at: rejectedAt }
      : { key: "finance", label: "Finance approval", state: "pending" };
    payment = { key: "payment", label: "Payment", state: "pending" };
  } else if (status === "Approved") {
    manager = { key: "manager", label: "Manager approval", state: "done", at: forwardEntry?.at };
    finance = { key: "finance", label: "Finance approval", state: "done", at: e.ApprovedAt };
    payment = { key: "payment", label: "Payment", state: "current" };
  } else {
    manager = forwarded
      ? { key: "manager", label: "Manager approval", state: "done", at: forwardEntry?.at }
      : { key: "manager", label: "Manager approval", state: "current" };
    finance = { key: "finance", label: "Finance approval", state: forwarded ? "current" : "pending" };
    payment = { key: "payment", label: "Payment", state: "pending" };
  }
  return [submitted, manager, finance, payment];
}

function StatusTimeline({ expense }: { expense: MasterExpense }) {
  const stages = computeStages(expense);
  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Progress</p>
      <ol className="mt-3">
        {stages.map((s, i) => {
          const last = i === stages.length - 1;
          const Icon =
            s.state === "done" ? CheckCircle2 : s.state === "rejected" ? XCircle : s.state === "current" ? Clock : Circle;
          const color =
            s.state === "done" ? "text-success"
            : s.state === "rejected" ? "text-destructive"
            : s.state === "current" ? "text-primary"
            : "text-muted-foreground/40";
          return (
            <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
              {!last ? (
                <span className={cn("absolute left-[8px] top-5 h-[calc(100%-4px)] w-px", s.state === "done" ? "bg-success/40" : "bg-border")} />
              ) : null}
              <Icon className={cn("z-10 h-[17px] w-[17px] shrink-0", color, s.state === "current" && "animate-pulse")} />
              <div className="-mt-0.5 min-w-0">
                <p className={cn("text-xs font-medium", s.state === "pending" && "text-muted-foreground", s.state === "current" && "text-primary")}>
                  {s.label}
                  {s.state === "current" ? <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">in progress</span> : null}
                  {s.state === "rejected" ? <span className="ml-1.5 text-[10px] font-normal text-destructive">rejected here</span> : null}
                </p>
                {s.at ? <p className="text-[10px] text-muted-foreground">{formatDate(s.at, "MMM d, HH:mm")}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ExpenseDetailDrawer({
  expense,
  open,
  onOpenChange,
  onApprove,
  onReject,
  disabled,
}: {
  expense: MasterExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}) {
  const [opening, setOpening] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; kind: "image" | "pdf" } | null>(null);

  // Sign the storage path, then show the file full-size in a popup.
  const openPreview = async (att: AttachmentRef, key: string) => {
    setOpening(key);
    try {
      let url = att.path;
      if (!/^https?:\/\//i.test(url)) {
        const { data } = await apiClient.get<{ url: string }>("/storage/sign", { params: { path: att.path } });
        url = data.url;
      }
      const kind = /\.pdf(\?|$)/i.test(att.path) || /\.pdf$/i.test(att.name) ? "pdf" : "image";
      setPreview({ url, name: att.name, kind });
    } catch {
      toast.error("Could not open the receipt.");
    } finally {
      setOpening(null);
    }
  };

  if (!expense) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md" />
      </Sheet>
    );
  }

  const items = Array.isArray(expense.ExpenseData) ? expense.ExpenseData : [];
  const receipts = items.flatMap((inv, i) =>
    invoiceFiles(inv).map((att, j) => ({
      key: `${inv.EMSUniqueId || i}-${j}`,
      label: att.name !== "Receipt" ? att.name : inv.VendorName || `Receipt ${i + 1}`,
      att,
    })),
  );
  const canDecide = !!onApprove && !!onReject && expense.ApprovalStatus === "Pending";

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{expense.ExpenseTitle}</SheetTitle>
          <SheetDescription className="font-mono text-[11px]">{expense.ExpenseId}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
            <TieredAmount amount={expenseTotal(expense)} size="lg" />
          </div>
          <StatusBadge status={expense.ApprovalStatus} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <Row label="Submitter" value={expense.SubmitterName} />
          <Row label="Submitted" value={formatDate(expense.SubmissionDate, "MMM d, yyyy")} hint={formatRelative(expense.SubmissionDate)} />
          <Row label="Approver" value={expense.ApproverEmail} className="col-span-2" />
        </div>

        <StatusTimeline expense={expense} />

        {items.length > 0 ? (
          <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Line items ({items.length})
            </p>
            <ul className="mt-2 space-y-2">
              {items.map((inv) => {
                const first = invoiceFiles(inv)[0];
                return (
                  <li key={inv.EMSUniqueId} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{inv.VendorName ?? "Vendor"}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {inv.InvoiceNumber ?? "—"} · {inv.Category ?? "Uncategorized"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {first ? (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Preview receipt"
                          disabled={opening === inv.EMSUniqueId}
                          onClick={() => openPreview(first, inv.EMSUniqueId)}
                        >
                          {opening === inv.EMSUniqueId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        </Button>
                      ) : null}
                      <TieredAmount amount={toAmount(inv.InvoiceAmount)} size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Paperclip className="h-3 w-3" /> Attachments ({receipts.length})
          </p>
          {receipts.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {receipts.map((r) => (
                <li key={`r-${r.key}`} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
                  <span className="truncate">{r.label}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={opening === `att-${r.key}`}
                    onClick={() => openPreview(r.att, `att-${r.key}`)}
                  >
                    {opening === `att-${r.key}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                    Preview
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No file attached to this expense.</p>
          )}
        </div>

        {Array.isArray(expense.ApprovalHistory) && expense.ApprovalHistory.length > 0 ? (
          <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">History</p>
            <ol className="mt-2 space-y-2 text-xs">
              {expense.ApprovalHistory.map((h, i) => (
                <li key={i} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="text-foreground">
                    <span className="font-medium">{h.from}</span> → <span className="font-medium">{h.to}</span>
                  </p>
                  {h.comments ? <p className="mt-1 text-[11px] text-muted-foreground">&ldquo;{h.comments}&rdquo;</p> : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">by {h.by} · {formatRelative(h.at)}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {canDecide ? (
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2 border-t border-border bg-card/95 px-6 py-3 backdrop-blur-xl">
            <Button variant="outline" size="sm" onClick={onReject} disabled={disabled} className="text-destructive hover:bg-destructive/10">
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
            <Button size="sm" onClick={onApprove} disabled={disabled}>
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>

    {/* Full-size attachment preview */}
    <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8 text-sm">{preview?.name}</DialogTitle>
        </DialogHeader>
        {preview?.kind === "pdf" ? (
          <iframe
            src={preview.url}
            title={preview.name}
            className="h-[70vh] w-full rounded-lg border border-border bg-white"
          />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt={preview.name}
            className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
          />
        ) : null}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => preview && window.open(preview.url, "_blank", "noopener")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function Row({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-medium">{value}</p>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
