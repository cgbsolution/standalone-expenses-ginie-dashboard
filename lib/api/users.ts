import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { MOCK_TEAM } from "@/lib/mocks/users";
import { sleep } from "@/lib/utils";
import type { Role, User } from "@/types/auth";

export interface ListUsersParams {
  tenant?: string;
  role?: Role;
  q?: string;
}

export async function listUsers(params: ListUsersParams = {}): Promise<User[]> {
  if (USE_MOCKS) {
    await sleep(220);
    return MOCK_TEAM.filter((u) => {
      if (params.tenant && u.tenantSlug !== params.tenant) return false;
      if (params.role && u.role !== params.role) return false;
      if (params.q) {
        const q = params.q.toLowerCase();
        if (!u.email.toLowerCase().includes(q) && !u.displayName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }
  const { data } = await apiClient.get<User[]>("/users", { params });
  return data;
}

export async function getUser(email: string): Promise<User | null> {
  if (USE_MOCKS) {
    await sleep(180);
    return MOCK_TEAM.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
  const { data } = await apiClient.get<User>(`/users/${encodeURIComponent(email)}`);
  return data;
}

export interface UpdateUserInput {
  email: string;
  displayName?: string;
  department?: string | null;
  grade?: string | null;
  managerEmail?: string | null;
  financeManagerEmail?: string | null;
  employeeId?: string | null;
  companyCode?: string | null;
  vendorCode?: string | null;
  costCenter?: string | null;
  sectionCode?: string | null;
  role?: "admin" | "employee";
}

export async function updateUser(input: UpdateUserInput): Promise<User> {
  if (USE_MOCKS) {
    await sleep(300);
    const existing = MOCK_TEAM.find((u) => u.email === input.email);
    if (!existing) throw new Error("User not found");
    return { ...existing, ...input };
  }
  const { email, ...body } = input;
  const { data } = await apiClient.put<User>(`/users/${encodeURIComponent(email)}`, body);
  return data;
}

export interface UpdateProfileInput {
  email: string;
  integrationProvider?: string | null;
  avatarUrl?: string | null;
}

/** Self-service profile fields (integration provider, avatar URL). */
export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  if (USE_MOCKS) {
    await sleep(250);
    const existing = MOCK_TEAM.find((u) => u.email === input.email);
    if (!existing) throw new Error("User not found");
    if (input.integrationProvider !== undefined) {
      existing.integrationProvider = input.integrationProvider;
    }
    if (input.avatarUrl !== undefined) existing.avatarUrl = input.avatarUrl ?? undefined;
    return { ...existing };
  }
  const { email, ...body } = input;
  const { data } = await apiClient.patch<User>(
    `/users/${encodeURIComponent(email)}/profile`,
    body,
  );
  return data;
}

/** Upload a profile picture; returns the updated user (with the new avatarUrl). */
export async function uploadAvatar(email: string, file: File): Promise<User> {
  if (USE_MOCKS) {
    await sleep(400);
    const existing = MOCK_TEAM.find((u) => u.email === email);
    if (!existing) throw new Error("User not found");
    existing.avatarUrl = URL.createObjectURL(file);
    return { ...existing };
  }
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<User>(
    `/users/${encodeURIComponent(email)}/avatar`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export interface InviteUserInput {
  tenantSlug: string;
  email: string;
  displayName: string;
  role: "admin" | "employee";
  department?: string | null;
  employeeId?: string | null;
  managerEmail?: string | null;
}

/** The invited user, plus the one-time link they use to set their password
 *  (also emailed) — surfaced so an admin can share it manually if needed. */
export type InvitedUser = User & { inviteUrl?: string | null };

export async function inviteUser(input: InviteUserInput): Promise<InvitedUser> {
  if (USE_MOCKS) {
    await sleep(400);
    const clash = MOCK_TEAM.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (clash) throw new Error("Someone with that email is already on the team");
    const user: User = {
      id: `u_${input.tenantSlug}_${MOCK_TEAM.length + 1}`,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      tenantSlug: input.tenantSlug,
      department: input.department ?? null,
      employeeId: input.employeeId ?? null,
      managerEmail: input.managerEmail ?? null,
      authProvider: "local",
    };
    MOCK_TEAM.push(user);
    return {
      ...user,
      inviteUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password?token=demo-token`,
    };
  }
  const { data } = await apiClient.post<InvitedUser>("/users", input);
  return data;
}

export interface BulkUserRow {
  email: string;
  displayName: string;
  role?: "admin" | "employee";
  department?: string | null;
  grade?: string | null;
  employeeId?: string | null;
  managerEmail?: string | null;
  financeManagerEmail?: string | null;
}

export interface BulkInviteResult {
  created: string[];
  duplicates: string[];
  invalid: { email: string; reason: string }[];
  createdCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export async function bulkInviteUsers(
  tenantSlug: string,
  users: BulkUserRow[],
): Promise<BulkInviteResult> {
  if (USE_MOCKS) {
    await sleep(600);
    const created: string[] = [];
    const duplicates: string[] = [];
    const invalid: { email: string; reason: string }[] = [];
    const seen = new Set<string>();
    for (const row of users) {
      const email = (row.email ?? "").trim().toLowerCase();
      const name = (row.displayName ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
        invalid.push({ email: row.email ?? "", reason: !name ? "Missing name" : "Invalid email" });
        continue;
      }
      const exists =
        seen.has(email) || MOCK_TEAM.some((u) => u.email.toLowerCase() === email);
      if (exists) {
        duplicates.push(email);
        continue;
      }
      seen.add(email);
      MOCK_TEAM.push({
        id: `u_${tenantSlug}_${MOCK_TEAM.length + 1}`,
        email,
        displayName: name,
        role: row.role ?? "employee",
        tenantSlug,
        department: row.department ?? null,
        grade: row.grade ?? null,
        employeeId: row.employeeId ?? null,
        managerEmail: row.managerEmail ?? null,
        authProvider: "local",
      });
      created.push(email);
    }
    return {
      created,
      duplicates,
      invalid,
      createdCount: created.length,
      duplicateCount: duplicates.length,
      invalidCount: invalid.length,
    };
  }
  const { data } = await apiClient.post<BulkInviteResult>("/users/bulk", { tenantSlug, users });
  return data;
}
