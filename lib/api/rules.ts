import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";

export interface RuleConditions {
  amountOver?: number;
  category?: string;
  grade?: string;
}

export type RuleAction = "auto_approve" | "auto_reject" | "route" | "escalate";

export interface ApprovalRule {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: RuleConditions;
  action: RuleAction;
  createdAt: string;
}

export type RuleInput = {
  name: string;
  enabled?: boolean;
  priority?: number;
  conditions?: RuleConditions;
  action?: RuleAction;
};

export async function listRules(slug: string): Promise<ApprovalRule[]> {
  if (USE_MOCKS) { await sleep(180); return []; }
  const { data } = await apiClient.get<ApprovalRule[]>("/rules", { params: { slug } });
  return data;
}

export async function createRule(slug: string, input: RuleInput): Promise<ApprovalRule> {
  const { data } = await apiClient.post<ApprovalRule>("/rules", { slug, ...input });
  return data;
}

export async function updateRule(id: string, input: Partial<RuleInput>): Promise<ApprovalRule> {
  const { data } = await apiClient.put<ApprovalRule>(`/rules/${encodeURIComponent(id)}`, input);
  return data;
}

export async function deleteRule(id: string): Promise<void> {
  await apiClient.delete(`/rules/${encodeURIComponent(id)}`);
}
