"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const role = session?.user?.role;
  const slug = session?.user?.tenantSlug ?? "";
  const base = role === "admin" ? `/t/${slug}/admin` : "/super-admin";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-[260px] justify-between gap-2 border-border/80 bg-background/50 px-3 text-xs text-muted-foreground md:flex"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Search anything…
        </span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {role === "super_admin" ? (
            <CommandGroup heading="Platform">
              <CommandItem onSelect={() => go("/super-admin")}>
                <LayoutDashboard /> Overview
                <CommandShortcut>G O</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/super-admin/tenants")}>
                <Building2 /> Tenants
                <CommandShortcut>G T</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/super-admin/users")}>
                <Users /> Users
              </CommandItem>
              <CommandItem onSelect={() => go("/super-admin/billing")}>
                <CreditCard /> Billing
              </CommandItem>
            </CommandGroup>
          ) : (
            <CommandGroup heading="Workspace">
              <CommandItem onSelect={() => go(base)}>
                <LayoutDashboard /> Dashboard
              </CommandItem>
              <CommandItem onSelect={() => go(`${base}/expenses`)}>
                <Receipt /> Expenses
              </CommandItem>
              <CommandItem onSelect={() => go(`${base}/approvals`)}>
                <ShieldCheck /> Approvals
              </CommandItem>
              <CommandItem onSelect={() => go(`${base}/team`)}>
                <Users /> Team
              </CommandItem>
            </CommandGroup>
          )}
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => go(role === "super_admin" ? "/super-admin/settings" : `${base}/settings`)}>
              <Settings /> Settings
            </CommandItem>
            <CommandItem
              onSelect={async () => {
                setOpen(false);
                await logout();
                clear();
                router.replace("/login");
              }}
            >
              <LogOut /> Log out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
