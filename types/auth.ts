export type Role = "super_admin" | "admin" | "employee";

/**
 * Mirrors the response shape of `expenses-backend` /auth/login → rowToUser().
 * Fields above the divider are real backend fields. Fields below are layered on
 * by the dashboard until the backend grows multi-tenancy + roles.
 */
export interface User {
  id: string;
  email: string;
  mail?: string;
  userPrincipalName?: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  grade?: string | null;
  managerEmail?: string | null;
  employeeId?: string | null;
  department?: string | null;
  companyCode?: string | null;
  vendorCode?: string | null;
  costCenter?: string | null;
  sectionCode?: string | null;
  authProvider?: "local" | "microsoft";
  /** Self-service sign-in provider chosen on the Integrations row (microsoft | google | email). */
  integrationProvider?: string | null;

  // ---- dashboard-only (synthesized client-side until backend supports) ----
  role: Role;
  tenantId?: string;
  tenantSlug?: string;
  avatarUrl?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  user: User;
}
