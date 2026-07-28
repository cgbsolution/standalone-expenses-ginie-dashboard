import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";

export interface WorkspaceConfig {
  currency: string;
  fiscalYearStart: string;
  weekStart: string;
  receiptRequired: boolean;
  perClaimLimit: number;
  autoApproveUnder: number;
  notifyByEmail: boolean;
  brandColor: string;
  /**
   * Super-admin controlled, per tenant. Lets the finance approver record
   * payment by hand once an expense is fully approved — for tenants with no
   * SAP connection to post payments through.
   */
  manualPaymentEnabled: boolean;
}

export interface TenantConfigResponse {
  slug: string;
  config: WorkspaceConfig;
  updatedAt: string | null;
}

const DEFAULTS: WorkspaceConfig = {
  currency: "INR", fiscalYearStart: "April", weekStart: "Monday",
  receiptRequired: true, perClaimLimit: 0, autoApproveUnder: 0,
  notifyByEmail: true, brandColor: "", manualPaymentEnabled: false,
};

/** '__platform__' is the reserved slug for super-admin platform settings. */
export const PLATFORM_SLUG = "__platform__";

export async function getConfig(slug: string): Promise<TenantConfigResponse> {
  if (USE_MOCKS) { await sleep(180); return { slug, config: DEFAULTS, updatedAt: null }; }
  const { data } = await apiClient.get<TenantConfigResponse>(`/tenant-config/${encodeURIComponent(slug)}`);
  return data;
}

export async function updateConfig(slug: string, config: Partial<WorkspaceConfig>): Promise<TenantConfigResponse> {
  const { data } = await apiClient.put<TenantConfigResponse>(
    `/tenant-config/${encodeURIComponent(slug)}`,
    { config },
  );
  return data;
}
