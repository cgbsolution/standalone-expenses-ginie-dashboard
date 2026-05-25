import type { User } from "@/types/auth";

export const MOCK_SUPER_ADMIN: User = {
  id: "u_owner",
  email: "owner@expgenie.com",
  displayName: "Deepak Rawat",
  givenName: "Deepak",
  surname: "Rawat",
  role: "super_admin",
  authProvider: "local",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Deepak%20Rawat",
};

export const MOCK_TENANT_ADMIN: User = {
  id: "u_acme_admin",
  email: "admin@acme.com",
  displayName: "Riya Mehta",
  givenName: "Riya",
  surname: "Mehta",
  role: "admin",
  tenantId: "t_1",
  tenantSlug: "acme",
  department: "Finance",
  employeeId: "ACM-0042",
  managerEmail: "ceo@acme.com",
  authProvider: "local",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Riya%20Mehta",
};

export const MOCK_TEAM: User[] = [
  MOCK_TENANT_ADMIN,
  {
    id: "u_acme_1",
    email: "alex@acme.com",
    displayName: "Alex Tanner",
    role: "employee",
    tenantId: "t_1",
    tenantSlug: "acme",
    department: "Engineering",
    employeeId: "ACM-0143",
    authProvider: "local",
  },
  {
    id: "u_acme_2",
    email: "maya@acme.com",
    displayName: "Maya Okafor",
    role: "employee",
    tenantId: "t_1",
    tenantSlug: "acme",
    department: "Sales",
    employeeId: "ACM-0207",
    authProvider: "local",
  },
  {
    id: "u_acme_3",
    email: "kenji@acme.com",
    displayName: "Kenji Ito",
    role: "employee",
    tenantId: "t_1",
    tenantSlug: "acme",
    department: "Marketing",
    employeeId: "ACM-0301",
    authProvider: "local",
  },
];

/** All canned passwords for the mock layer. */
export const MOCK_PASSWORD = "demo1234";
