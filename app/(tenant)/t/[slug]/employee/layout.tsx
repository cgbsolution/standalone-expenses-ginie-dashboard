import { AppShell } from "@/components/layout/app-shell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requireRole="employee">{children}</AppShell>;
}
