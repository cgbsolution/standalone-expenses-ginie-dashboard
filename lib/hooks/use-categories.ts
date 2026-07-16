"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryInput,
} from "@/lib/api/categories";

export function useCategories(slug: string) {
  return useQuery({
    queryKey: ["categories", slug],
    queryFn: () => listCategories(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useCreateCategory(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(slug, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", slug] }),
  });
}

export function useUpdateCategory(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) => updateCategory(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", slug] }),
  });
}

export function useDeleteCategory(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", slug] }),
  });
}
