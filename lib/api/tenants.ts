import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { MOCK_TENANTS } from "@/lib/mocks/tenants";
import { sleep } from "@/lib/utils";
import type { Tenant } from "@/types/tenant";

export async function listTenants(): Promise<Tenant[]> {
  if (USE_MOCKS) {
    await sleep(280);
    return MOCK_TENANTS;
  }
  const { data } = await apiClient.get<Tenant[]>("/tenants");
  return data;
}

export async function getTenant(slug: string): Promise<Tenant | null> {
  if (USE_MOCKS) {
    await sleep(220);
    return MOCK_TENANTS.find((t) => t.slug === slug || t.id === slug) ?? null;
  }
  const { data } = await apiClient.get<Tenant>(`/tenants/${encodeURIComponent(slug)}`);
  return data;
}

export interface CreateTenantInput {
  name: string;
  adminEmail: string;
  adminName: string;
  plan: Tenant["plan"];
  customSubdomain?: string;
}

/** The created tenant, plus the one-time link the new admin uses to set their
 *  password (also emailed). Surfaced so the super-admin can share it manually
 *  when email delivery isn't configured. */
export type CreatedTenant = Tenant & { inviteUrl?: string | null };

export async function createTenant(input: CreateTenantInput): Promise<CreatedTenant> {
  if (USE_MOCKS) {
    await sleep(400);
    const slug = input.customSubdomain ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      id: slug,
      slug,
      name: input.name,
      plan: input.plan,
      status: "trialing",
      userCount: 1,
      monthlyExpenseVolume: 0,
      mrr: 0,
      createdAt: new Date().toISOString(),
      adminEmail: input.adminEmail,
      adminName: input.adminName,
      customSubdomain: input.customSubdomain,
      inviteUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password?token=demo-token`,
    };
  }
  const { data } = await apiClient.post<CreatedTenant>("/tenants", input);
  return data;
}

export type UpdateTenantInput = {
  status?: Tenant["status"];
  plan?: Tenant["plan"];
};

/** PATCH /tenants/:slug — change status (suspend / churn / reactivate) or plan. */
export async function updateTenant(
  slug: string,
  input: UpdateTenantInput,
): Promise<{ slug: string; status: Tenant["status"]; plan: Tenant["plan"]; mrr: number }> {
  if (USE_MOCKS) {
    await sleep(200);
    return { slug, status: input.status ?? "active", plan: input.plan ?? "growth", mrr: 0 };
  }
  const { data } = await apiClient.patch(`/tenants/${encodeURIComponent(slug)}`, input);
  return data;
}
