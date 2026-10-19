import { decodeJwt, jwtVerify, type JWTPayload } from "jose";
import { USE_MOCKS } from "@/lib/constants";
import type { Role } from "@/types/auth";

export interface DecodedSession {
  sub: string;
  role: Role;
  tenantSlug: string | null;
  /** Expiry, epoch milliseconds. */
  exp: number;
}

const ISSUER = "expgenie";
const AUDIENCE = "expgenie-api";
const VALID_ROLES: ReadonlySet<string> = new Set(["super_admin", "admin", "employee"]);

function shape(claims: JWTPayload): DecodedSession | null {
  const role = String(claims.role ?? "");
  if (!claims.sub || !VALID_ROLES.has(role) || typeof claims.exp !== "number") return null;
  const tenant = (claims.tenantSlug ?? claims.tenant ?? null) as string | null;
  return { sub: claims.sub, role: role as Role, tenantSlug: tenant, exp: claims.exp * 1000 };
}

/**
 * Reads the session token the backend issued at sign-in. Server-side only —
 * middleware and server components.
 *
 * With AUTH_JWT_SECRET set (the same value as the backend's) the signature is
 * verified, so a hand-made cookie can't open another role's pages. Without it
 * the claims are only decoded: that decides nothing more than which page shell
 * renders, because the backend checks every API call itself.
 */
export async function readSession(token: string | undefined | null): Promise<DecodedSession | null> {
  if (!token) return null;
  try {
    const secret = process.env.AUTH_JWT_SECRET;
    if (secret) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ["HS256"],
      });
      return shape(payload);
    }
    if (USE_MOCKS) return decodeMockSession(token);
    const payload = decodeJwt(token);
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return shape(payload);
  } catch {
    return null;
  }
}

/** Mock mode only: the unsigned base64url payload minted by `synthesizeSession`. */
function decodeMockSession(token: string): DecodedSession | null {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const parsed = JSON.parse(atob(padded + padding)) as Partial<DecodedSession>;
  if (!parsed?.sub || !parsed.role || typeof parsed.exp !== "number") return null;
  if (parsed.exp < Date.now()) return null;
  return { sub: parsed.sub, role: parsed.role, tenantSlug: parsed.tenantSlug ?? null, exp: parsed.exp };
}
