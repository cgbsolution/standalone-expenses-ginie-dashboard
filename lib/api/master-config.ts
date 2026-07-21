import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";

export interface PolicyRule {
  id: string;
  slug: string;
  ruleId: string;
  enabled: boolean;
  priority: number;
  ruleGroup: string;
  ruleType: string;
  params: Record<string, unknown>;
}

export interface PolicyCap {
  id: string;
  slug: string;
  normalized: string;
  grade: string;
  capAmount: number;
  isActuals: boolean;
  selfApprove: boolean;
}

export interface MasterConfig {
  rules: PolicyRule[];
  policyCaps: PolicyCap[];
}

export async function getMasterConfig(slug: string): Promise<MasterConfig> {
  if (USE_MOCKS) {
    await sleep(180);
    return { rules: [], policyCaps: [] };
  }
  const { data } = await apiClient.get<MasterConfig>(`/master-config/${encodeURIComponent(slug)}`);
  return data;
}

// ---- Policy caps (tenant_policy_caps) — per-tenant reimbursement caps ------

export type PolicyCapInput = {
  normalized: string;
  grade: string;
  capAmount?: number;
  isActuals?: boolean;
  selfApprove?: boolean;
};

export async function createPolicyCap(slug: string, input: PolicyCapInput): Promise<PolicyCap> {
  const { data } = await apiClient.post<PolicyCap>(
    `/master-config/${encodeURIComponent(slug)}/policy-caps`,
    input,
  );
  return data;
}

export async function updatePolicyCap(
  slug: string,
  id: string,
  input: Partial<PolicyCapInput>,
): Promise<PolicyCap> {
  const { data } = await apiClient.put<PolicyCap>(
    `/master-config/${encodeURIComponent(slug)}/policy-caps/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function deletePolicyCap(slug: string, id: string): Promise<void> {
  await apiClient.delete(
    `/master-config/${encodeURIComponent(slug)}/policy-caps/${encodeURIComponent(id)}`,
  );
}

// ---- Policy / output rules (tenant_rules) — per-tenant bot rules -----------

export type PolicyRuleInput = {
  ruleId: string;
  enabled?: boolean;
  priority?: number;
  ruleGroup?: string;
  ruleType?: string;
  params?: Record<string, unknown>;
};

export async function createPolicyRule(slug: string, input: PolicyRuleInput): Promise<PolicyRule> {
  const { data } = await apiClient.post<PolicyRule>(
    `/master-config/${encodeURIComponent(slug)}/rules`,
    input,
  );
  return data;
}

export async function updatePolicyRule(
  slug: string,
  id: string,
  input: Partial<PolicyRuleInput>,
): Promise<PolicyRule> {
  const { data } = await apiClient.put<PolicyRule>(
    `/master-config/${encodeURIComponent(slug)}/rules/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function deletePolicyRule(slug: string, id: string): Promise<void> {
  await apiClient.delete(
    `/master-config/${encodeURIComponent(slug)}/rules/${encodeURIComponent(id)}`,
  );
}
