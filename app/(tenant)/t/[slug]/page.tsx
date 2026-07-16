"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { homeRouteForRole } from "@/lib/nav";

// Bare /t/<slug> has no page of its own — send the user to their role home
// (admin or employee dashboard) instead of a 404. Used by the "Xeltrion"
// breadcrumb.
export default function TenantIndexPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.session?.user?.role);

  useEffect(() => {
    router.replace(homeRouteForRole(role ?? "employee", params.slug));
  }, [role, params.slug, router]);

  return null;
}
