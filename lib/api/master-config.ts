import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";

export interface PolicyRule {
  ruleId: string;
  enabled: boolean;
  priority: number;
  ruleGroup: string;
  ruleType: string;
  params: Record<string, unknown>;
}

export interface PolicyCap {
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
