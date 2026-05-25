import { AppShell } from "@/components/layout/app-shell";

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requireRole="admin">{children}</AppShell>;
}
