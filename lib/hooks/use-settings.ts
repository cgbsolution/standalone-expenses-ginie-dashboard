"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfig, updateConfig, type WorkspaceConfig } from "@/lib/api/settings";

export function useConfig(slug: string) {
  return useQuery({
    queryKey: ["config", slug],
    queryFn: () => getConfig(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useUpdateConfig(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<WorkspaceConfig>) => updateConfig(slug, config),
    onSuccess: (data) => qc.setQueryData(["config", slug], data),
  });
}
