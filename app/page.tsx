import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { readSession } from "@/lib/session";
import { homeRouteForRole } from "@/lib/nav";

export default async function RootPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await readSession(token);
  if (!session) redirect("/login");
  redirect(homeRouteForRole(session.role, session.tenantSlug));
}
