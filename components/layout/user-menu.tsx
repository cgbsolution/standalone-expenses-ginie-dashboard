"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { logout } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const clear = useAuthStore((s) => s.clear);

  if (!session) return null;
  const { user } = session;

  const settingsHref =
    user.role === "super_admin"
      ? "/super-admin/settings"
      : `/t/${user.tenantSlug ?? "acme"}/admin/settings`;

  async function handleLogout() {
    await logout();
    clear();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Account menu" className="rounded-full p-0">
          <UserAvatar name={user.displayName} src={user.avatarUrl ?? undefined} size="sm" online />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2 py-1">
            <UserAvatar name={user.displayName} src={user.avatarUrl ?? undefined} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{user.displayName}</p>
              <p className="truncate text-[10px] normal-case tracking-normal text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/profile")}>
          <User className="h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(settingsHref)}>
          <Settings className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/profile?tab=notifications")}>
          <Bell className="h-4 w-4" /> Notification prefs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
