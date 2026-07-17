"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterConfig } from "@/lib/api/master-config";

export function useMasterConfig(slug: string) {
  return useQuery({
    queryKey: ["master-config", slug],
    queryFn: () => getMasterConfig(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}
