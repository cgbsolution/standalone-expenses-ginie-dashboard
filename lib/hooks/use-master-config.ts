"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMasterConfig,
  createPolicyCap,
  updatePolicyCap,
  deletePolicyCap,
  createPolicyRule,
  updatePolicyRule,
  deletePolicyRule,
  type PolicyCapInput,
  type PolicyRuleInput,
} from "@/lib/api/master-config";

export function useMasterConfig(slug: string) {
  return useQuery({
    queryKey: ["master-config", slug],
    queryFn: () => getMasterConfig(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

const invalidate = (slug: string) => ({ queryKey: ["master-config", slug] as const });

// ---- policy caps ----------------------------------------------------------

export function useCreatePolicyCap(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PolicyCapInput) => createPolicyCap(slug, input),
    onSuccess: () => qc.invalidateQueries(invalidate(slug)),
  });
}

export function useUpdatePolicyCap(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PolicyCapInput> }) =>
      updatePolicyCap(slug, id, input),
    onSuccess: () => qc.invalidateQueries(invalidate(slug)),
  });
}

export function useDeletePolicyCap(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePolicyCap(slug, id),
    onSuccess: () => qc.invalidateQueries(invalidate(slug)),
  });
}

// ---- policy / output rules ------------------------------------------------

export function useCreatePolicyRule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PolicyRuleInput) => createPolicyRule(slug, input),
    onSuccess: () => qc.invalidateQueries(invalidate(slug)),
  });
}

export function useUpdatePolicyRule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PolicyRuleInput> }) =>
      updatePolicyRule(slug, id, input),
    onSuccess: () => qc.invalidateQueries(invalidate(slug)),
  });
}

export function useDeletePolicyRule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePolicyRule(slug, id),
    onSuccess: () => qc.invalidateQueries(invalidate(slug)),
  });
}
