import { AppShell } from "@/components/layout/app-shell";

export const metadata = { title: "Profile" };

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
