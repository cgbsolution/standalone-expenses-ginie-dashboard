import type { Role } from "@/types/auth";

export interface DecodedSession {
  sub: string;
  role: Role;
  tenantSlug: string | null;
  exp: number;
}

/**
 * Decodes the base64url session token minted by `lib/api/auth.ts:synthesizeSession`.
 * No signature verification — that needs a real JWT secret once the backend issues
 * them. Returns `null` for any malformed / expired token.
 */
export function decodeSession(token: string | undefined | null): DecodedSession | null {
  if (!token) return null;
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(padded + padding, "base64").toString("utf8")
        : decodeURIComponent(escape(atob(padded + padding)));
    const parsed = JSON.parse(json) as Partial<DecodedSession>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.sub || !parsed.role || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return {
      sub: parsed.sub,
      role: parsed.role,
      tenantSlug: parsed.tenantSlug ?? null,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
