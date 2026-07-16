import { toAmount } from "@/lib/format";
import type { MasterExpense, ExpenseInvoice } from "@/types/expense";

export interface AttachmentRef {
  name: string;
  /** Raw storage path or URL — sign via /storage/sign before opening. */
  path: string;
}

/**
 * All attachments on a line item. The mobile app and chatbot write them to
 * `File[]` ({url, filename}); some older rows use ReceiptUrl / SasUrl.
 */
export function invoiceFiles(inv: ExpenseInvoice): AttachmentRef[] {
  const files: AttachmentRef[] = [];
  if (Array.isArray(inv.File)) {
    for (const f of inv.File) {
      const path = f?.blob_url || f?.url;
      if (path) files.push({ name: f?.filename || "Receipt", path });
    }
  }
  if (!files.length && inv.ReceiptUrl) files.push({ name: "Receipt", path: inv.ReceiptUrl });
  if (!files.length && inv.SasUrl) files.push({ name: "Receipt", path: inv.SasUrl });
  return files;
}

/**
 * Robust expense total. Backend TotalAmount can be a number, a comma-formatted
 * string, or missing — so parse it, and fall back to summing the invoice lines.
 * Prevents ₹0.00 / NaN in tables, dashboards, and charts.
 */
export function expenseTotal(e: MasterExpense): number {
  const t = toAmount(e.TotalAmount);
  return t > 0 ? t : (e.ExpenseData ?? []).reduce((s, inv) => s + toAmount(inv.InvoiceAmount), 0);
}
