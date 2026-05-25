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

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
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
    };
  }
  // POST /tenants is not yet implemented backend-side — until then we surface a
  // friendly error rather than a 404 wall of text.
  throw new Error(
    "Tenant creation isn't wired to the backend yet. Add a `POST /tenants` route on expenses-backend.",
  );
}
