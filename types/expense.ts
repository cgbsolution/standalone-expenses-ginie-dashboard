import type { AuditTrailEntry } from "./common";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Draft";

/**
 * Payment is tracked separately from approval. For tenants wired to SAP the
 * posting drives it; for tenants without SAP a super-admin can enable
 * `manualPaymentEnabled` and finance ticks it off by hand after final approval.
 */
export type PaymentStatus = "Unpaid" | "Paid";

export interface PaymentInfo {
  Method: "Manual";
  PaidAt: string;
  PaidBy: string;
  Reference: string;
  Note: string;
}

/** Single invoice line on a master expense — matches backend `ExpenseData[]`. */
export interface ExpenseInvoice {
  EMSUniqueId: string;
  InvoiceAmount: number;
  InvoiceNumber?: string;
  VendorName?: string;
  Category?: string;
  PostingDate: string;
  DocumentDate: string;
  SelfApprove: boolean;
  /** Category label — the chatbot writes it here as ExpenseType, not Category. */
  ExpenseType?: string;
  SubCategory?: string;
  ReceiptUrl?: string;
  /** Signed/storage URL set by some submission paths instead of File[]. */
  SasUrl?: string;
  /** Attachments as written by the mobile app / chatbot: [{ url, filename }]. */
  File?: { url?: string; blob_url?: string; filename?: string }[];
  Description?: string;
}

/**
 * Master expense — exactly the shape `expenses-backend` /master-expense rowToShape
 * returns. Field names are PascalCase to mirror the backend.
 */
export interface MasterExpense {
  id: string;
  ExpenseId: string;
  ExpenseTitle: string;
  ApproverEmail: string;
  SubmitterEmail: string;
  SubmitterName: string;
  ApprovalStatus: ApprovalStatus;
  ExpenseData: ExpenseInvoice[];
  TotalAmount: number;
  SubmissionDate: string;
  ApprovalHistory?: AuditTrailEntry[];
  LastActionAt?: string;
  ApprovedAt?: string;
  /** Always sent by the backend; defaults to "Unpaid". */
  PaymentStatus?: PaymentStatus;
  PaymentInfo?: PaymentInfo | null;
  RejectionInfo?: {
    Reason: string;
    Comments?: string;
    RejectedAt: string;
    RejectedBy: string;
  };
  _ts?: number;
}

export interface ExpenseCounts {
  all: number;
  approved: number;
  rejected: number;
  pending: number;
  draft: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  monthlyBudget: number;
  spent: number;
}
