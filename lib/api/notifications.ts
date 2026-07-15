import apiClient from "./client";
import { USE_MOCKS } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

// Only used when NEXT_PUBLIC_USE_MOCKS=true (offline UI development).
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "mock-1",
    type: "approval_needed",
    title: "Approval needed",
    body: 'Ankur Maheshwari submitted "Delhi Trip — October" (₹14,820) for your approval.',
    expenseId: null,
    actorEmail: null,
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "mock-2",
    type: "approved",
    title: "Expense approved",
    body: '"Client lunch — Olive" (₹6,420) was approved by Tarun Mehrotra.',
    expenseId: null,
    actorEmail: null,
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

/** GET /notifications?email=&status= */
export async function listNotifications(
  email: string,
  status?: "all" | "unread",
): Promise<NotificationItem[]> {
  if (USE_MOCKS) {
    await sleep(200);
    return status === "unread"
      ? MOCK_NOTIFICATIONS.filter((n) => !n.read)
      : MOCK_NOTIFICATIONS;
  }
  const { data } = await apiClient.get<NotificationItem[]>("/notifications", {
    params: status ? { email, status } : { email },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /notifications/unread-count?email= */
export async function getUnreadCount(email: string): Promise<number> {
  if (USE_MOCKS) {
    await sleep(120);
    return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  }
  const { data } = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
    { params: { email } },
  );
  return data?.count ?? 0;
}

/** PUT /notifications/:id/read */
export async function markNotificationRead(id: string): Promise<void> {
  if (USE_MOCKS) return;
  await apiClient.put(`/notifications/${encodeURIComponent(id)}/read`);
}

/** PUT /notifications/read-all */
export async function markAllNotificationsRead(email: string): Promise<number> {
  if (USE_MOCKS) return 0;
  const { data } = await apiClient.put<{ updated: number }>(
    "/notifications/read-all",
    { email },
  );
  return data?.updated ?? 0;
}
