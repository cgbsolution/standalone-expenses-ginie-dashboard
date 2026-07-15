"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";

// Poll interval keeps the bell live without a websocket.
const POLL_MS = 30_000;

export function useNotifications(email: string | undefined) {
  return useQuery({
    queryKey: ["notifications", "list", email],
    queryFn: () => listNotifications(email as string),
    enabled: !!email,
    staleTime: 15_000,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount(email: string | undefined) {
  return useQuery({
    queryKey: ["notifications", "unread-count", email],
    queryFn: () => getUnreadCount(email as string),
    enabled: !!email,
    staleTime: 15_000,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => markAllNotificationsRead(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
