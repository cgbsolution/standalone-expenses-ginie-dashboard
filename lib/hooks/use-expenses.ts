"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExpenseCounts,
  listAllExpenses,
  listTenantExpenses,
  listApproverExpenses,
  listExpenses,
  markExpensePaid,
  updateExpenseStatus,
  type ListExpensesParams,
  type MarkPaidInput,
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

/** Every expense in a tenant — the tenant-admin's org-wide view. */
export function useTenantExpenses(slug: string) {
  return useQuery({
    queryKey: ["expenses", "tenant", slug],
    queryFn: () => listTenantExpenses(slug),
    staleTime: 30_000,
    enabled: !!slug,
  });
}

/** Team-wide: every submission across the company (admin Expenses page). */
export function useAllExpenses(
  approvalStatus?: "All" | "Pending" | "Approved" | "Rejected" | "Draft",
) {
  return useQuery({
    queryKey: ["expenses", "all", approvalStatus ?? "All"],
    queryFn: () => listAllExpenses(approvalStatus),
    staleTime: 30_000,
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
    // The backend implements 2-level approval (manager → finance). When a
    // manager "Approves", the server may keep ApprovalStatus = "Pending" and
    // forward to the finance manager. Use the actual returned status to pick
    // the right toast — otherwise the approver sees "Approved" but the item
    // re-appears in someone else's queue with no explanation.
    onSuccess: (data, input) => {
      if (input.ApprovalStatus === "Approved" && data?.ApprovalStatus === "Pending") {
        toast.success("Forwarded to Finance Manager", {
          description: "Your approval is recorded. Awaiting Finance review.",
        });
      } else if (input.ApprovalStatus === "Approved") {
        toast.success("Expense approved");
      } else if (input.ApprovalStatus === "Rejected") {
        toast.success("Expense rejected");
      } else {
        toast.success("Expense updated");
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

/**
 * Manual payment tick (tenants without SAP). Kept separate from
 * `useUpdateExpenseStatus` because it moves PaymentStatus, not ApprovalStatus —
 * the two are independent axes and an expense can be Approved + Unpaid.
 */
export function useMarkExpensePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkPaidInput) => markExpensePaid(input),
    onSuccess: (data, input) => {
      // Patch every cached list in place so the row flips without a refetch.
      qc.getQueriesData<MasterExpense[]>({ queryKey: ["expenses"] }).forEach(([key, prev]) => {
        if (!Array.isArray(prev)) return;
        qc.setQueryData(
          key,
          prev.map((e) =>
            e.id === input.id
              ? { ...e, PaymentStatus: data.PaymentStatus, PaymentInfo: data.PaymentInfo }
              : e,
          ),
        );
      });
      toast.success(input.Paid === false ? "Payment mark removed" : "Payment recorded");
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not record payment"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
