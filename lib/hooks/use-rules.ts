"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  type RuleInput,
} from "@/lib/api/rules";

export function useRules(slug: string) {
  return useQuery({
    queryKey: ["rules", slug],
    queryFn: () => listRules(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useCreateRule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleInput) => createRule(slug, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules", slug] }),
  });
}

export function useUpdateRule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RuleInput> }) => updateRule(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules", slug] }),
  });
}

export function useDeleteRule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules", slug] }),
  });
}
