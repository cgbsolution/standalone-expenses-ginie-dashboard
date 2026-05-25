import { Settings as SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function PlatformSettingsPage() {
  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Branding, email templates, integrations, security defaults"
      />
      <ComingSoon
        icon={SettingsIcon}
        title="Platform configuration"
        bullets={[
          "Brand: logo, favicons, primary color, login page imagery",
          "Email templates: signup, password reset, approval notifications",
          "Default plan and trial duration for new tenants",
          "Security policy: password rules, session length, IP allowlist",
          "Outbound webhooks and integration secrets",
        ]}
      />
    </>
  );
}
