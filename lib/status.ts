import type { ApprovalStatus } from "@/types/expense";

/**
 * Collapse any backend status string into one of the 4 canonical statuses.
 * The chatbot writes non-standard values like "PendingFinance"/"PendingManager"
 * straight into the DB; without this they crash StatusBadge and break every
 * `status === "Pending"` count/filter.
 */
export function normalizeStatus(raw: string | null | undefined): ApprovalStatus {
  const k = (raw || "").toLowerCase();
  if (k.startsWith("approv")) return "Approved";
  if (k.startsWith("reject")) return "Rejected";
  if (k.startsWith("draft")) return "Draft";
  return "Pending"; // Pending, PendingFinance, PendingManager, unknown → Pending
}

/** Human-readable label that preserves the stage nuance where useful. */
export function statusLabel(raw: string | null | undefined): string {
  const k = (raw || "").toLowerCase().replace(/[\s_]/g, "");
  if (k === "pendingfinance") return "Pending · Finance";
  if (k === "pendingmanager") return "Pending · Manager";
  return normalizeStatus(raw);
}
