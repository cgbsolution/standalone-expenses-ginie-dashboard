"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTenant, getTenant, listTenants, type CreateTenantInput } from "@/lib/api/tenants";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";

export function useTenants() {
  return useQuery({
    queryKey: ["tenants", "list"],
    queryFn: listTenants,
    staleTime: 60_000,
  });
}

export function useTenant(idOrSlug: string | null | undefined) {
  return useQuery({
    queryKey: ["tenants", "detail", idOrSlug],
    queryFn: () => getTenant(idOrSlug as string),
    enabled: !!idOrSlug,
    staleTime: 60_000,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => createTenant(input),
    onSuccess: (tenant) => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(`${tenant.name} created`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not create tenant")),
  });
}
