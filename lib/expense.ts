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

/**
 * Resolve an expense's category. The mobile app fills ExpenseData[0].Category,
 * but the chatbot leaves it null and puts the label in ExpenseType instead — so
 * fall back through the fields that actually carry it before giving up.
 */
export function expenseCategory(e: MasterExpense): string {
  const inv = e.ExpenseData?.[0];
  const pick = (v?: string) => (v && v.trim() ? v.trim() : "");
  return (
    pick(inv?.Category) ||
    pick(inv?.ExpenseType) ||
    pick(inv?.SubCategory) ||
    pick(e.ExpenseTitle) ||
    "Uncategorised"
  );
}

/**
 * A line item's narration — what the bill was actually for, in the submitter's
 * words.
 *
 * Every submission path fills Narration, but several fill it with filler when
 * the user never typed one: the mobile app's "Business expense", the chatbot's
 * "Expense from <file>.pdf", the extraction engine's "<Type> expense: <bill no>",
 * or a bare copy of the bill/document number. Showing that to an approver is
 * worse than showing nothing, so it's filtered out here — the same rule the
 * mobile app applies on its expense cards.
 */
export function invoiceNarration(inv?: ExpenseInvoice): string {
  const text = (inv?.Narration ?? inv?.Description ?? "").trim();
  if (!text) return "";

  const billNo = String(inv?.BillNumber ?? "").trim();
  const docNo = String(inv?.ItemData?.DocumentNo ?? "").trim();
  const invNo = String(inv?.InvoiceNumber ?? "").trim();

  // Some paths stuff the bill/document number into the narration field.
  if ([billNo, docNo, invNo].some((n) => n && n === text)) return "";
  if (/^business expense$/i.test(text)) return "";
  if (/^expense from /i.test(text)) return "";
  if (/^non-bill expense on /i.test(text)) return "";
  // "<Type> expense: <bill no>" from the extraction engine. Only filler while
  // the tail is empty or just the bill number — otherwise the user wrote it.
  const generated = /^.+ expense:\s*(.*)$/i.exec(text);
  if (generated) {
    const tail = (generated[1] ?? "").trim();
    if (!tail || tail === billNo || tail === invNo) return "";
  }
  return text;
}

/**
 * The single narration to show for a whole expense — only when every line item
 * agrees on it (the common case: one bill, one purpose). When lines disagree,
 * each one carries its own instead.
 */
export function expenseNarration(e: MasterExpense): string {
  const all = (e.ExpenseData ?? []).map(invoiceNarration).filter(Boolean);
  const first = all[0];
  if (!first) return "";
  return all.every((n) => n === first) ? first : "";
}
