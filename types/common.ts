export type Currency = "USD" | "EUR" | "GBP" | "INR";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ID = string;

export interface AuditTrailEntry {
  at: string;
  by: string;
  from: string;
  to: string;
  comments?: string;
  reason?: string;
  action_status?: string;
}
