"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIntegrations,
  updateIntegrations,
  type IntegrationsInput,
} from "@/lib/api/integrations";

export function useIntegrations(slug: string) {
  return useQuery({
    queryKey: ["integrations", slug],
    queryFn: () => getIntegrations(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useUpdateIntegrations(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IntegrationsInput) => updateIntegrations(slug, payload),
    onSuccess: (data) => {
      qc.setQueryData(["integrations", slug], data);
    },
  });
}
