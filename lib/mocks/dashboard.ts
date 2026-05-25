import { MOCK_TENANTS } from "./tenants";

export interface KpiPoint {
  label: string;
  value: number;
  deltaPct: number;
  spark: number[];
}

export interface TenantGrowthPoint {
  month: string;
  tenants: number;
  active: number;
}

export interface RevenueByPlanPoint {
  month: string;
  starter: number;
  growth: number;
  scale: number;
  enterprise: number;
}

export interface SpendTrendPoint {
  date: string;
  spend: number;
  reimbursed: number;
}

export const SUPER_ADMIN_KPIS: KpiPoint[] = [
  {
    label: "Total Tenants",
    value: 124,
    deltaPct: 8.4,
    spark: [62, 68, 71, 74, 79, 88, 95, 102, 108, 114, 120, 124],
  },
  {
    label: "Active Users",
    value: 8_924,
    deltaPct: 12.2,
    spark: [4200, 4600, 5100, 5500, 6000, 6400, 6900, 7500, 8000, 8400, 8700, 8924],
  },
  {
    label: "MRR",
    value: 184_200,
    deltaPct: 6.1,
    spark: [110_000, 118_000, 124_000, 132_000, 138_000, 144_000, 152_000, 160_000, 168_000, 174_000, 179_000, 184_200],
  },
  {
    label: "Expenses Processed",
    value: 1_482_113,
    deltaPct: 18.7,
    spark: [600_000, 720_000, 810_000, 880_000, 920_000, 1_020_000, 1_120_000, 1_210_000, 1_290_000, 1_360_000, 1_420_000, 1_482_113],
  },
];

export const TENANT_GROWTH_12MO: TenantGrowthPoint[] = [
  { month: "Jun '25", tenants: 62, active: 54 },
  { month: "Jul '25", tenants: 68, active: 59 },
  { month: "Aug '25", tenants: 71, active: 64 },
  { month: "Sep '25", tenants: 74, active: 66 },
  { month: "Oct '25", tenants: 79, active: 70 },
  { month: "Nov '25", tenants: 88, active: 78 },
  { month: "Dec '25", tenants: 95, active: 84 },
  { month: "Jan '26", tenants: 102, active: 91 },
  { month: "Feb '26", tenants: 108, active: 96 },
  { month: "Mar '26", tenants: 114, active: 102 },
  { month: "Apr '26", tenants: 120, active: 109 },
  { month: "May '26", tenants: 124, active: 113 },
];

export const REVENUE_BY_PLAN_12MO: RevenueByPlanPoint[] = [
  { month: "Jun '25", starter: 0, growth: 22_400, scale: 48_000, enterprise: 31_000 },
  { month: "Jul '25", starter: 0, growth: 24_000, scale: 52_800, enterprise: 31_000 },
  { month: "Aug '25", starter: 0, growth: 25_600, scale: 55_200, enterprise: 37_200 },
  { month: "Sep '25", starter: 0, growth: 27_200, scale: 57_600, enterprise: 37_200 },
  { month: "Oct '25", starter: 0, growth: 28_800, scale: 60_000, enterprise: 43_400 },
  { month: "Nov '25", starter: 0, growth: 32_000, scale: 64_800, enterprise: 43_400 },
  { month: "Dec '25", starter: 0, growth: 34_400, scale: 67_200, enterprise: 49_600 },
  { month: "Jan '26", starter: 0, growth: 36_800, scale: 69_600, enterprise: 49_600 },
  { month: "Feb '26", starter: 0, growth: 38_400, scale: 72_000, enterprise: 55_800 },
  { month: "Mar '26", starter: 0, growth: 40_000, scale: 74_400, enterprise: 55_800 },
  { month: "Apr '26", starter: 0, growth: 41_600, scale: 76_800, enterprise: 62_000 },
  { month: "May '26", starter: 0, growth: 43_200, scale: 79_200, enterprise: 62_000 },
];

export const TOP_TENANTS_BY_USAGE = MOCK_TENANTS
  .filter((t) => t.status === "active")
  .sort((a, b) => b.monthlyExpenseVolume - a.monthlyExpenseVolume)
  .slice(0, 5);

export const RECENT_SIGNUPS = [...MOCK_TENANTS]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);

// ---------- Tenant admin dashboard ----------

export const ADMIN_KPIS: KpiPoint[] = [
  {
    label: "This Month Spend",
    value: 78_410,
    deltaPct: 11.4,
    spark: [42_000, 45_000, 48_000, 51_000, 55_000, 58_000, 61_000, 64_000, 68_000, 72_000, 75_000, 78_410],
  },
  {
    label: "Pending Approvals",
    value: 17,
    deltaPct: -4.2,
    spark: [22, 21, 20, 18, 19, 19, 18, 17, 18, 17, 18, 17],
  },
  {
    label: "Reimbursed",
    value: 64_220,
    deltaPct: 9.8,
    spark: [32_000, 36_000, 39_000, 43_000, 47_000, 50_000, 53_000, 56_000, 58_000, 60_000, 62_000, 64_220],
  },
  {
    label: "Top Category",
    value: 28_410, // Travel monthly spend
    deltaPct: 6.7,
    spark: [12_000, 14_000, 16_000, 18_000, 20_000, 22_000, 23_000, 24_000, 26_000, 27_000, 28_000, 28_410],
  },
];

export const ADMIN_SPEND_TREND_30D: SpendTrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const day = 30 - i;
  const date = new Date(Date.UTC(2026, 4, 20 - day));
  const base = 1800 + Math.sin(i / 2) * 600 + i * 35;
  return {
    date: date.toISOString().slice(0, 10),
    spend: Math.round(base + 200 + (i % 5) * 80),
    reimbursed: Math.round(base * 0.7 + (i % 4) * 60),
  };
});
