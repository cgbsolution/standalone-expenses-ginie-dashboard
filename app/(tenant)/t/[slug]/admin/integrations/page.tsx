import { Plug } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect ExpGenie to your accounting stack, chat tools, and SSO"
      />
      <ComingSoon
        icon={Plug}
        title="Integrations directory"
        bullets={[
          "Accounting: QuickBooks, Xero, Tally, Zoho Books",
          "Chat: Slack, Microsoft Teams — approval requests inline",
          "SSO: Google Workspace, Microsoft Entra ID, Okta, JumpCloud",
          "Storage: Google Drive, OneDrive for receipt archival",
          "Custom outbound webhooks for any event",
        ]}
      />
    </>
  );
}
