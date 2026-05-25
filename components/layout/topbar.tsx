"use client";

import { Bell, Menu } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";

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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Badge variant="default" className="px-1.5 text-[10px]">
            3 new
          </Badge>
        </div>
        <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
          {[
            "Riya approved EXP-2026-0428",
            "Lumen Robotics upgraded to Growth",
            "Northwind invoice payment received",
          ].map((msg, i) => (
            <li key={i} className="flex flex-col gap-1 px-4 py-3 text-xs">
              <span className="text-foreground">{msg}</span>
              <span className="text-muted-foreground">a few minutes ago</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
