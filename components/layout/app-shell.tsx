"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { navForRole } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";

interface AppShellProps {
  /** Required role for this segment. Omit to allow any logged-in user (e.g. /profile). */
  requireRole?: "super_admin" | "admin" | "employee";
  children: React.ReactNode;
}

export function AppShell({ requireRole, children }: AppShellProps) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (requireRole && session.user.role !== requireRole) {
      router.replace("/unauthorized");
    }
  }, [isHydrated, session, requireRole, router]);

  if (!isHydrated || !session || (requireRole && session.user.role !== requireRole)) {
    return <FullPageSkeleton />;
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 dark:opacity-100 opacity-50">
        <div className="absolute inset-0 grid-pattern dark:opacity-50 opacity-30" />
        <div className="absolute inset-x-0 top-0 h-96 bg-aurora-primary" />
      </div>

      <Sidebar />
      <MobileSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-6 lg:px-8 lg:py-8 animate-fade-in-up">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function MobileSidebar() {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const session = useAuthStore((s) => s.session);

  if (!session) return null;
  const sections = navForRole(session.user.role, session.user.tenantSlug ?? "");

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <nav className="space-y-6 px-4 py-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <li key={it.href}>
                      <a
                        href={it.href}
                        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {it.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function FullPageSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden w-[260px] border-r border-border/60 p-4 lg:block">
        <Skeleton className="h-8 w-32" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-8 space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
