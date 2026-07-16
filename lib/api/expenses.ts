import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { MOCK_COUNTS, MOCK_EXPENSES } from "@/lib/mocks/expenses";
import { sleep } from "@/lib/utils";
import type { ApprovalStatus, ExpenseCounts, MasterExpense } from "@/types/expense";

export interface ListExpensesParams {
  email: string;
  approvalStatus?: ApprovalStatus | "All";
}

/** GET /master-expense?email=&approvalStatus= */
export async function listExpenses(params: ListExpensesParams): Promise<MasterExpense[]> {
  if (USE_MOCKS) {
    await sleep(260);
    const status = params.approvalStatus;
    if (!status || status === "All") return MOCK_EXPENSES;
    return MOCK_EXPENSES.filter((e) => e.ApprovalStatus === status);
  }
  const { data } = await apiClient.get<MasterExpense[]>("/master-expense", { params });
  return data;
}

/** GET /master-expense/all?status= — team-wide admin view (every submission). */
export async function listAllExpenses(
  approvalStatus?: ApprovalStatus | "All",
): Promise<MasterExpense[]> {
  if (USE_MOCKS) {
    await sleep(260);
    if (!approvalStatus || approvalStatus === "All") return MOCK_EXPENSES;
    return MOCK_EXPENSES.filter((e) => e.ApprovalStatus === approvalStatus);
  }
  const { data } = await apiClient.get<MasterExpense[]>("/master-expense/all", {
    params: approvalStatus && approvalStatus !== "All" ? { status: approvalStatus } : undefined,
  });
  return data;
}

/** GET /master-expense/approver?email= */
export async function listApproverExpenses(email: string): Promise<MasterExpense[]> {
  if (USE_MOCKS) {
    await sleep(260);
    return MOCK_EXPENSES.filter((e) => e.ApproverEmail === email);
  }
  const { data } = await apiClient.get<MasterExpense[]>("/master-expense/approver", {
    params: { email },
  });
  return data;
}

/** GET /master-expense/counts?email=&role= */
export async function getExpenseCounts(
  email: string,
  role: "submitter" | "approver" = "approver",
): Promise<ExpenseCounts> {
  if (USE_MOCKS) {
    await sleep(180);
    return MOCK_COUNTS;
  }
  const { data } = await apiClient.get<ExpenseCounts>("/master-expense/counts", {
    params: { email, role },
  });
  return data;
}

export interface UpdateStatusInput {
  id: string;
  ApprovalStatus: ApprovalStatus;
  UpdatedBy?: string;
  Comments?: string;
  RejectionReason?: string;
}

/** PUT /master-expense/:id */
export async function updateExpenseStatus(input: UpdateStatusInput): Promise<MasterExpense> {
  if (USE_MOCKS) {
    await sleep(320);
    const existing = MOCK_EXPENSES.find((e) => e.id === input.id);
    if (!existing) throw new Error("Expense not found");
    return {
      ...existing,
      ApprovalStatus: input.ApprovalStatus,
      LastActionAt: new Date().toISOString(),
    };
  }
  const { id, ...body } = input;
  const { data } = await apiClient.put<MasterExpense>(`/master-expense/${id}`, body);
  return data;
}
