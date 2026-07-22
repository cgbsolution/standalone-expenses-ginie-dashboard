"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bulkInviteUsers,
  deleteUser,
  inviteUser,
  listUsers,
  updateUser,
  type BulkUserRow,
  type InviteUserInput,
  type ListUsersParams,
  type UpdateUserInput,
} from "@/lib/api/users";
import { apiErrorMessage } from "@/lib/api/client";
import type { User } from "@/types/auth";

export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => listUsers(params),
    staleTime: 30_000,
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Invitation sent to ${user.email}`, {
        description: user.inviteUrl
          ? `They were emailed a link to set their password. Or share it directly: ${user.inviteUrl}`
          : "They were emailed a link to set their password.",
        duration: 15000,
      });
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not invite employee")),
  });
}

export function useBulkInviteUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantSlug, users }: { tenantSlug: string; users: BulkUserRow[] }) =>
      bulkInviteUsers(tenantSlug, users),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      const parts = [`${result.createdCount} added`];
      if (result.duplicateCount) parts.push(`${result.duplicateCount} duplicate${result.duplicateCount > 1 ? "s" : ""} skipped`);
      if (result.invalidCount) parts.push(`${result.invalidCount} invalid`);
      const summary = parts.join(" · ");
      if (result.createdCount > 0) {
        toast.success(`Import complete — ${summary}`, {
          description: result.createdCount
            ? "New employees were emailed a link to set their password."
            : undefined,
        });
      } else {
        toast.info(`Nothing imported — ${summary}`);
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not import employees")),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["users"] });
      const snapshots = qc.getQueriesData<User[]>({ queryKey: ["users"] });
      snapshots.forEach(([key, prev]) => {
        if (!Array.isArray(prev)) return;
        qc.setQueryData(
          key,
          prev.map((u) => (u.email === input.email ? { ...u, ...input } : u)),
        );
      });
      return { snapshots };
    },
    onError: (err, _input, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => qc.setQueryData(key, prev));
      toast.error(apiErrorMessage(err, "Could not update profile"));
    },
    onSuccess: (user) => {
      toast.success(`${user.displayName}'s profile updated`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => deleteUser(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (err) => toast.error(apiErrorMessage(err, "Could not remove user")),
  });
}
