"use client";

import { Bell, Menu } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/hooks/use-notifications";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Topbar() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const role = useAuthStore((s) => s.session?.user?.role);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <div className="hidden flex-1 md:block">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />
        {role === "super_admin" ? <TenantSwitcher /> : null}
        <NotificationsBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function TenantSwitcher() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="hidden h-9 gap-2 md:inline-flex">
          <span className="h-2 w-2 rounded-full bg-success" />
          All tenants
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Switch context
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Cross-tenant view is on. Pick a tenant from the directory to impersonate or filter.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function NotificationsBell() {
  const email = useAuthStore((s) => s.session?.user?.email);
  const { data: items = [], isLoading } = useNotifications(email);
  const { data: unreadCount = 0 } = useUnreadCount(email);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => email && markAll.mutate(email)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
          {isLoading ? (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">Loading…</li>
          ) : items.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-muted-foreground">
              You&apos;re all caught up
            </li>
          ) : (
            items.map((n) => (
              <li
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                }}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 px-4 py-3 text-xs transition-colors hover:bg-muted/50",
                  !n.read && "bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">{n.title}</span>
                  {!n.read ? (
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
                <span className="text-muted-foreground">{n.body}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelative(n.createdAt)}
                </span>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
