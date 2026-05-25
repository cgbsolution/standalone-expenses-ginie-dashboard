export const APP_NAME = "ExpGenie";
export const APP_TAGLINE = "Effortless expense management.";

export const SESSION_COOKIE = "expg_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

export const USE_MOCKS =
  (process.env.NEXT_PUBLIC_USE_MOCKS ?? "false").toLowerCase() === "true";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

export const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "xeltrion";

export const PLAN_LABELS = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
  enterprise: "Enterprise",
} as const;

export const STATUS_LABELS = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
  Draft: "Draft",
} as const;

export const TIME_RANGES = ["7D", "30D", "90D", "1Y"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];
