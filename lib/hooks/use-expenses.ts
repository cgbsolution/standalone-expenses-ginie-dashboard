"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExpenseCounts,
  listApproverExpenses,
  listExpenses,
  updateExpenseStatus,
  type ListExpensesParams,
  type UpdateStatusInput,
} from "@/lib/api/expenses";
import type { MasterExpense } from "@/types/expense";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";

export function useExpenses(params: ListExpensesParams) {
  return useQuery({
    queryKey: ["expenses", "list", params],
    queryFn: () => listExpenses(params),
    staleTime: 30_000,
    enabled: !!params.email,
  });
}

export function useApproverExpenses(email: string) {
  return useQuery({
    queryKey: ["expenses", "approver", email],
    queryFn: () => listApproverExpenses(email),
    staleTime: 30_000,
    enabled: !!email,
  });
}

export function useExpenseCounts(email: string, role: "submitter" | "approver" = "approver") {
  return useQuery({
    queryKey: ["expenses", "counts", email, role],
    queryFn: () => getExpenseCounts(email, role),
    staleTime: 30_000,
    enabled: !!email,
  });
}

/**
 * Convenience hook for the employee view: their own submissions, optionally
 * filtered by status. Wraps `listExpenses({ email, approvalStatus })`.
 */
export function useMyExpenses(email: string, approvalStatus?: "All" | "Pending" | "Approved" | "Rejected" | "Draft") {
  return useQuery({
    queryKey: ["expenses", "submitter", email, approvalStatus ?? "All"],
    queryFn: () => listExpenses({ email, approvalStatus }),
    staleTime: 30_000,
    enabled: !!email,
  });
}

export function useUpdateExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStatusInput) => updateExpenseStatus(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["expenses"] });
      const snapshots = qc.getQueriesData<MasterExpense[]>({ queryKey: ["expenses"] });
      snapshots.forEach(([key, prev]) => {
        if (!Array.isArray(prev)) return;
        qc.setQueryData(
          key,
          prev.map((e) =>
            e.id === input.id ? { ...e, ApprovalStatus: input.ApprovalStatus } : e,
          ),
        );
      });
      return { snapshots };
    },
    onError: (err, _input, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => qc.setQueryData(key, prev));
      toast.error(apiErrorMessage(err, "Could not update expense"));
    },
    onSuccess: () => {
      toast.success("Expense updated");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
