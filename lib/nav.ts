import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  FileBarChart,
  FileText,
  Folder,
  LayoutDashboard,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import type { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export function superAdminNav(): NavSection[] {
  return [
    {
      label: "Platform",
      items: [
        { label: "Overview", href: "/super-admin", icon: LayoutDashboard },
        { label: "Tenants", href: "/super-admin/tenants", icon: Building2 },
        { label: "Users", href: "/super-admin/users", icon: Users },
      ],
    },
    {
      label: "Business",
      items: [
        { label: "Billing", href: "/super-admin/billing", icon: CreditCard },
        { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Audit Logs", href: "/super-admin/audit-logs", icon: ScrollText },
        { label: "Settings", href: "/super-admin/settings", icon: Settings },
      ],
    },
  ];
}

export function adminNav(slug: string): NavSection[] {
  const base = `/t/${slug}/admin`;
  return [
    {
      label: "Overview",
      items: [
        // Expenses & Approvals are surfaced within the Dashboard for the tenant
        // admin (tenant-wide stats), so they're intentionally omitted from the nav.
        { label: "Dashboard", href: base, icon: LayoutDashboard },
      ],
    },
    {
      label: "Organize",
      items: [
        { label: "Categories", href: `${base}/categories`, icon: Folder },
        { label: "Team", href: `${base}/team`, icon: Users },
        { label: "Rules", href: `${base}/approvals/rules`, icon: Workflow },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Reports", href: `${base}/reports`, icon: FileBarChart },
        { label: "Activity", href: `${base}/activity`, icon: Activity },
      ],
    },
    {
      label: "Configure",
      items: [
        { label: "Integrations", href: `${base}/integrations`, icon: Plug },
        { label: "Documents", href: `${base}/documents`, icon: FileText },
        { label: "Settings", href: `${base}/settings`, icon: Settings },
      ],
    },
  ];
}

export function employeeNav(slug: string): NavSection[] {
  const base = `/t/${slug}/employee`;
  return [
    {
      label: "My workspace",
      items: [
        { label: "Dashboard", href: base, icon: LayoutDashboard },
        { label: "My expenses", href: `${base}/expenses`, icon: Receipt },
        { label: "Reimbursements", href: `${base}/reimbursements`, icon: Wallet },
      ],
    },
    {
      label: "Activity",
      items: [{ label: "Recent activity", href: `${base}/activity`, icon: Activity }],
    },
  ];
}

export function navForRole(role: Role, slug: string): NavSection[] {
  if (role === "super_admin") return superAdminNav();
  if (role === "admin") return adminNav(slug);
  return employeeNav(slug);
}

export function homeRouteForRole(role: Role, slug: string | null | undefined): string {
  if (role === "super_admin") return "/super-admin";
  if (!slug) return "/unauthorized";
  return role === "admin" ? `/t/${slug}/admin` : `/t/${slug}/employee`;
}
