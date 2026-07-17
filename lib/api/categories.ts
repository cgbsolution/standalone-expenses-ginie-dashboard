import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";

export interface ExpenseCategory {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon: string;
  monthlyBudget: number;
  glAccount: string;
  // Master-sheet attributes (bot-enforced, dashboard-displayed).
  normalized: string;
  requiresBill: boolean;
  excludedFromAutoApprove: boolean;
  enabled: boolean;
  glProject: string;
  glCrm: string;
  createdAt: string;
}

export type CategoryInput = {
  name: string;
  color?: string;
  icon?: string;
  monthlyBudget?: number;
  glAccount?: string;
  glProject?: string;
  glCrm?: string;
};

export async function listCategories(slug: string): Promise<ExpenseCategory[]> {
  if (USE_MOCKS) { await sleep(180); return []; }
  const { data } = await apiClient.get<ExpenseCategory[]>("/categories", { params: { slug } });
  return data;
}

export async function createCategory(slug: string, input: CategoryInput): Promise<ExpenseCategory> {
  const { data } = await apiClient.post<ExpenseCategory>("/categories", { slug, ...input });
  return data;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<ExpenseCategory> {
  const { data } = await apiClient.put<ExpenseCategory>(`/categories/${encodeURIComponent(id)}`, input);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${encodeURIComponent(id)}`);
}
