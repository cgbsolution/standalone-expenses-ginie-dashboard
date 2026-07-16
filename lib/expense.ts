import { toAmount } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";

/**
 * Robust expense total. Backend TotalAmount can be a number, a comma-formatted
 * string, or missing — so parse it, and fall back to summing the invoice lines.
 * Prevents ₹0.00 / NaN in tables, dashboards, and charts.
 */
export function expenseTotal(e: MasterExpense): number {
  const t = toAmount(e.TotalAmount);
  return t > 0 ? t : (e.ExpenseData ?? []).reduce((s, inv) => s + toAmount(inv.InvoiceAmount), 0);
}
