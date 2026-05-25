"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboard, fetchSuperAdminOverview } from "@/lib/api/dashboard";

export function useSuperAdminOverview() {
  return useQuery({
    queryKey: ["super-admin", "overview"],
    queryFn: fetchSuperAdminOverview,
    staleTime: 60_000,
  });
}

export function useAdminDashboard(tenantSlug: string) {
  return useQuery({
    queryKey: ["admin", "dashboard", tenantSlug],
    queryFn: () => fetchAdminDashboard(tenantSlug),
    staleTime: 60_000,
    enabled: !!tenantSlug,
  });
}
