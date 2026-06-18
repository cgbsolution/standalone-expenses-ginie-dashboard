"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  inviteUser,
  listUsers,
  updateUser,
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
      toast.success(`Invitation sent to ${user.email}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not invite employee")),
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
