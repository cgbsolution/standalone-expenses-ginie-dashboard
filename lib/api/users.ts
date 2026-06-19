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
