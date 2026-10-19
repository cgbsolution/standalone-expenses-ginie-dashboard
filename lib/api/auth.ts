import apiClient, { apiErrorMessage } from "./client";
import { SESSION_COOKIE, SESSION_TTL_MS, USE_MOCKS, DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { MOCK_PASSWORD, MOCK_SUPER_ADMIN, MOCK_TENANT_ADMIN } from "@/lib/mocks/users";
import { sleep } from "@/lib/utils";
import type { LoginRequest, LoginResponse, Role, Session, User } from "@/types/auth";

const VALID_ROLES: ReadonlySet<Role> = new Set(["super_admin", "admin", "employee"]);

/**
 * Mock mode only (no backend): an unsigned stand-in token so the middleware can
 * route by role. Real sign-ins use the token the backend signs.
 */
export function synthesizeSession(user: User): Session {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = {
    sub: user.email,
    role: user.role,
    tenantSlug: user.tenantSlug ?? null,
    exp: expiresAt,
  };
  const token = encode(payload);
  return { user, token, expiresAt };
}

function encode(payload: unknown): string {
  if (typeof window === "undefined") {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
  }
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function writeSessionCookie(token: string, expiresAt: number) {
  if (typeof document === "undefined") return;
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  document.cookie = `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0`;
}

async function mockLogin(req: LoginRequest): Promise<LoginResponse> {
  await sleep(420);
  if (req.password !== MOCK_PASSWORD) {
    throw new Error("Invalid email or password");
  }
  const email = req.email.toLowerCase().trim();
  if (email === MOCK_SUPER_ADMIN.email) {
    return { success: true, user: MOCK_SUPER_ADMIN };
  }
  if (email === MOCK_TENANT_ADMIN.email) {
    return { success: true, user: MOCK_TENANT_ADMIN };
  }
  // Any other email becomes a synthetic tenant admin for the default tenant.
  return {
    success: true,
    user: {
      id: `u_${email}`,
      email,
      displayName: email.split("@")[0] ?? "User",
      role: "admin",
      tenantSlug: DEFAULT_TENANT_SLUG,
      authProvider: "local",
    },
  };
}

export async function login(req: LoginRequest): Promise<Session> {
  if (USE_MOCKS) {
    const session = synthesizeSession((await mockLogin(req)).user);
    writeSessionCookie(session.token, session.expiresAt);
    return session;
  }

  let data: LoginResponse;
  try {
    ({ data } = await apiClient.post<LoginResponse>("/auth/login", req));
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not sign in"));
  }
  return startSession(data);
}

/**
 * Sign in with a one-time link from AskMira (the HRMS the company runs). The
 * token comes from the URL fragment of /sso/askmira; the backend checks it.
 */
export async function loginWithAskmira(token: string): Promise<Session> {
  let data: LoginResponse;
  try {
    ({ data } = await apiClient.post<LoginResponse>("/auth/askmira/exchange", { token }));
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not sign you in from AskMira"));
  }
  return startSession(data);
}

/** A backend sign-in answer → the dashboard session, with its cookie written. */
function startSession(data: LoginResponse): Session {
  if (!data?.user) throw new Error("Backend did not return a user");
  if (!data.token || !data.expiresAt) {
    throw new Error("The server did not issue a session. Update the ExpGenie backend.");
  }
  const role = (data.user.role ?? "").toLowerCase() as Role;
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Unknown role "${data.user.role ?? "<missing>"}" from backend`);
  }
  // The backend's signed token is the session; role + tenantSlug come from it too.
  const session: Session = {
    user: {
      ...data.user,
      role,
      tenantSlug: role === "super_admin" ? undefined : data.user.tenantSlug ?? DEFAULT_TENANT_SLUG,
    },
    token: data.token,
    expiresAt: data.expiresAt,
  };
  writeSessionCookie(session.token, session.expiresAt);
  return session;
}

export async function logout(): Promise<void> {
  clearSessionCookie();
}

/** Request a password-reset email. Always resolves (the backend never reveals
 *  whether the address exists), so the UI shows the same confirmation either way. */
export async function requestPasswordReset(email: string): Promise<void> {
  if (USE_MOCKS) {
    await sleep(420);
    return;
  }
  try {
    await apiClient.post("/auth/forgot-password", { email });
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not send the reset email"));
  }
}

/** Check whether a reset/invite token is still valid before showing the form. */
export async function validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  if (USE_MOCKS) {
    await sleep(250);
    return { valid: true, email: "demo@expgenie.com" };
  }
  try {
    const { data } = await apiClient.get<{ valid: boolean; email?: string }>(
      `/auth/reset-password/${encodeURIComponent(token)}`,
    );
    return data;
  } catch {
    return { valid: false };
  }
}

/** Set a new password using a valid reset/invite token. */
export async function resetPassword(token: string, password: string): Promise<void> {
  if (USE_MOCKS) {
    await sleep(420);
    return;
  }
  try {
    await apiClient.post("/auth/reset-password", { token, password });
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not reset your password"));
  }
}

export async function fetchMe(email: string): Promise<User | null> {
  if (USE_MOCKS) {
    await sleep(200);
    if (email === MOCK_SUPER_ADMIN.email) return MOCK_SUPER_ADMIN;
    if (email === MOCK_TENANT_ADMIN.email) return MOCK_TENANT_ADMIN;
    return null;
  }
  const { data } = await apiClient.get<{ user: User }>(`/auth/me`, { params: { email } });
  return data.user;
}
