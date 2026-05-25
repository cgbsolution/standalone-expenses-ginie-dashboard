import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { decodeSession } from "@/lib/session";
import { homeRouteForRole } from "@/lib/nav";

export default function RootPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? decodeSession(token) : null;
  if (!session) redirect("/login");
  redirect(homeRouteForRole(session.role, session.tenantSlug));
}
