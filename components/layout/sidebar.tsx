"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Settings, Sparkles } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { navForRole, type NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const session = useAuthStore((s) => s.session);
  const pathname = usePathname();

  const user = session?.user;
  if (!user) return null;

  const slug = user.tenantSlug ?? "";
  const sections = navForRole(user.role, slug);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-shrink-0 self-start border-r border-border bg-card/30 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex lg:flex-col",
        collapsed ? "w-[72px]" : "w-[260px]",
        className,
      )}
    >
      <SidebarHeader collapsed={collapsed} />
      <SidebarRoleBadge role={user.role} collapsed={collapsed} />
      <SidebarNav sections={sections} pathname={pathname} collapsed={collapsed} />
      <SidebarFooter
        collapsed={collapsed}
        userName={user.displayName}
        userEmail={user.email}
        avatarUrl={user.avatarUrl ?? null}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground lg:flex"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 shadow-glow-sm">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="title"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col"
          >
            <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Control Plane
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarRoleBadge({
  role,
  collapsed,
}: {
  role: "super_admin" | "admin" | "employee";
  collapsed: boolean;
}) {
  const label =
    role === "super_admin" ? "Super Admin" : role === "admin" ? "Tenant Admin" : "Team Member";
  if (collapsed) return <div className="px-4 pt-3" />;
  return (
    <div className="px-4 pt-3">
      <Badge variant="default" className="border-primary/30 bg-primary/10 text-[10px] uppercase tracking-wider">
        {label}
      </Badge>
    </div>
  );
}

function SidebarNav({
  sections,
  pathname,
  collapsed,
}: {
  sections: NavSection[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <TooltipProvider delayDuration={120}>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            ) : null}
            {section.items.map((item) => {
              const isActive = isItemActive(pathname, item.href);
              const Icon = item.icon;
              const content = (
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {isActive ? (
                    <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-violet-500 w-[3px]" />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <AnimatePresence initial={false}>
                    {!collapsed ? (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="flex-1 truncate"
                      >
                        {item.label}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  {item.badge && !collapsed ? (
                    <Badge variant="default" className="px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  ) : null}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.href}>{content}</div>
              );
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}

function isItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/super-admin") return pathname === "/super-admin";
  if (href.endsWith("/admin")) return pathname === href;
  return pathname.startsWith(href + "/") || pathname === href;
}

function SidebarFooter({
  collapsed,
  userName,
  userEmail,
  avatarUrl,
}: {
  collapsed: boolean;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="border-t border-border/60 p-3">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary",
          collapsed && "justify-center",
        )}
      >
        <UserAvatar name={userName} src={avatarUrl ?? undefined} size="sm" online />
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{userName}</p>
              <p className="truncate text-[10px] text-muted-foreground">{userEmail}</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
