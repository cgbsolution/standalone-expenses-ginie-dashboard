export type PlanTier = "starter" | "growth" | "scale" | "enterprise";

export type TenantStatus = "active" | "trialing" | "suspended" | "churned";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  /** Null when the tenant pre-dates plan assignment. UI falls back to "Growth". */
  plan: PlanTier | null;
  status: TenantStatus;
  userCount: number;
  monthlyExpenseVolume: number;
  mrr: number;
  createdAt: string;
  customSubdomain?: string;
  adminName?: string | null;
  adminEmail?: string | null;
}

export interface Plan {
  id: string;
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  features: string[];
  seats: number;
}

export interface SystemHealthMetric {
  apiUptimePct: number;
  queueDepth: number;
  dbLatencyMs: number;
  lastIncidentAt: string | null;
}
