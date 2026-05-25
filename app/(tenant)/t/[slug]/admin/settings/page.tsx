import { Settings as SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function TenantSettingsPage() {
  return (
    <>
      <PageHeader
        title="Workspace settings"
        description="Tenant-level configuration — branding, currency, policy"
      />
      <ComingSoon
        icon={SettingsIcon}
        title="Workspace configuration"
        bullets={[
          "Brand: logo, accent color, custom email sender domain",
          "Currency, fiscal year start, week start day",
          "Expense policy: per-category caps, per-employee limits, receipt requirements",
          "Notification preferences (default for new employees)",
          "Danger zone: data export, account deletion",
        ]}
      />
    </>
  );
}
