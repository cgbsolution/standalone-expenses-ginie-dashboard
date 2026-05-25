import {
  ADMIN_KPIS,
  ADMIN_SPEND_TREND_30D,
  RECENT_SIGNUPS,
  REVENUE_BY_PLAN_12MO,
  SUPER_ADMIN_KPIS,
  TENANT_GROWTH_12MO,
  TOP_TENANTS_BY_USAGE,
  type KpiPoint,
  type RevenueByPlanPoint,
  type SpendTrendPoint,
  type TenantGrowthPoint,
} from "@/lib/mocks/dashboard";
import { MOCK_CATEGORIES } from "@/lib/mocks/expenses";
import { MOCK_SYSTEM_HEALTH } from "@/lib/mocks/tenants";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import type { Category } from "@/types/expense";
import type { SystemHealthMetric, Tenant } from "@/types/tenant";
import apiClient from "./client";

export interface SuperAdminOverview {
  kpis: KpiPoint[];
  tenantGrowth: TenantGrowthPoint[];
  revenueByPlan: RevenueByPlanPoint[];
  recentSignups: Tenant[];
  topTenants: Tenant[];
  systemHealth: SystemHealthMetric;
}

export async function fetchSuperAdminOverview(): Promise<SuperAdminOverview> {
  if (USE_MOCKS) {
    await sleep(320);
    return {
      kpis: SUPER_ADMIN_KPIS,
      tenantGrowth: TENANT_GROWTH_12MO,
      revenueByPlan: REVENUE_BY_PLAN_12MO,
      recentSignups: RECENT_SIGNUPS,
      topTenants: TOP_TENANTS_BY_USAGE,
      systemHealth: MOCK_SYSTEM_HEALTH,
    };
  }
  const { data } = await apiClient.get<SuperAdminOverview>("/admin/overview");
  return data;
}

export interface AdminDashboard {
  kpis: KpiPoint[];
  spendTrend: SpendTrendPoint[];
  categories: Category[];
}

export async function fetchAdminDashboard(tenantSlug: string): Promise<AdminDashboard> {
  if (USE_MOCKS) {
    await sleep(300);
    return {
      kpis: ADMIN_KPIS,
      spendTrend: ADMIN_SPEND_TREND_30D,
      categories: MOCK_CATEGORIES,
    };
  }
  const { data } = await apiClient.get<AdminDashboard>("/admin/tenant-overview", {
    params: { tenant: tenantSlug },
  });
  return data;
}
