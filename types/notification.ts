/**
 * In-app notification produced by the approval workflow.
 * Mirrors the row shape returned by `expenses-backend` /notifications.
 */
export type NotificationType =
  | "approval_needed"
  | "approved"
  | "rejected"
  | "reimbursed"
  | "policy"
  | "comment"
  | (string & {});

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  expenseId: string | null;
  actorEmail: string | null;
  read: boolean;
  createdAt: string;
}
