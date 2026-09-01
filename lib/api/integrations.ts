import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";

/** Returned by the API — secrets are never sent back, only a `*Set` boolean. */
export interface SapConfig {
  enabled: boolean;
  baseUrl: string;
  authType: string; // 'basic' | 'oauth2'
  username: string;
  passwordSet: boolean;
  companyCode: string;
  glAccount: string;
  costCenter: string;
  taxCode: string;
}
export interface HrmsConfig {
  enabled: boolean;
  baseUrl: string;
  authType: string; // 'basic' | 'apikey'
  username: string;
  secretSet: boolean;
  employeeEndpoint: string;
  autoSync: boolean;
}
export interface TenantIntegrations {
  slug: string;
  sap: SapConfig;
  hrms: HrmsConfig;
  updatedAt: string | null;
}

/** Sent on PUT — secrets are plain optional strings (omit/blank = keep existing). */
export type SapConfigInput = Partial<Omit<SapConfig, "passwordSet">> & { password?: string };
export type HrmsConfigInput = Partial<Omit<HrmsConfig, "secretSet">> & { secret?: string };
export interface IntegrationsInput {
  sap?: SapConfigInput;
  hrms?: HrmsConfigInput;
}

export interface TestResult {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  message: string;
}

function emptyIntegrations(slug: string): TenantIntegrations {
  return {
    slug,
    sap: {
      enabled: false, baseUrl: "", authType: "basic", username: "",
      passwordSet: false, companyCode: "", glAccount: "", costCenter: "", taxCode: "",
    },
    hrms: {
      enabled: false, baseUrl: "", authType: "basic", username: "",
      secretSet: false, employeeEndpoint: "", autoSync: false,
    },
    updatedAt: null,
  };
}

/** A fully-wired tenant, for offline UI work and screenshot capture. The mock
 *  layer previously returned only `emptyIntegrations`, so the "Connected" state
 *  of this screen could never be seen without a live backend. Hostnames use the
 *  reserved example.com domain; no secret values are held here, only the
 *  `*Set` booleans the real API returns. */
function demoIntegrations(slug: string): TenantIntegrations {
  return {
    slug,
    sap: {
      enabled: true,
      baseUrl: "https://s4hana.example.com/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV",
      authType: "basic",
      username: "EXPGENIE_SVC",
      passwordSet: true,
      companyCode: "1000",
      glAccount: "0000400100",
      costCenter: "CC-FIN-01",
      taxCode: "V0",
    },
    hrms: {
      enabled: true,
      baseUrl: "https://hrms.example.com/api/v2",
      authType: "apikey",
      username: "expgenie-sync",
      secretSet: true,
      employeeEndpoint: "/employees?status=active",
      autoSync: true,
    },
    updatedAt: "2026-08-27T09:20:00.000Z",
  };
}

/** GET /integrations/:slug */
export async function getIntegrations(slug: string): Promise<TenantIntegrations> {
  if (USE_MOCKS) {
    await sleep(200);
    return demoIntegrations(slug);
  }
  const { data } = await apiClient.get<TenantIntegrations>(
    `/integrations/${encodeURIComponent(slug)}`,
  );
  return data;
}

/** PUT /integrations/:slug */
export async function updateIntegrations(
  slug: string,
  payload: IntegrationsInput,
): Promise<TenantIntegrations> {
  if (USE_MOCKS) {
    await sleep(300);
    return demoIntegrations(slug);
  }
  const { data } = await apiClient.put<TenantIntegrations>(
    `/integrations/${encodeURIComponent(slug)}`,
    payload,
  );
  return data;
}

/** POST /integrations/:slug/:type/test */
export async function testConnection(
  slug: string,
  type: "sap" | "hrms",
  baseUrl: string,
): Promise<TestResult> {
  if (USE_MOCKS) {
    await sleep(400);
    return { ok: true, status: 200, latencyMs: 214, message: "Connection OK — 200 in 214 ms" };
  }
  const { data } = await apiClient.post<TestResult>(
    `/integrations/${encodeURIComponent(slug)}/${type}/test`,
    { baseUrl },
  );
  return data;
}
