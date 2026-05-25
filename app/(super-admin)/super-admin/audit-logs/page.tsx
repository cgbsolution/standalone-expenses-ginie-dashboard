import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function AuditLogsPage() {
  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Every privileged action across the platform — searchable and filterable"
      />
      <ComingSoon
        icon={ScrollText}
        title="Platform audit trail"
        bullets={[
          "Capture: logins, role changes, tenant lifecycle, billing edits",
          "Filter by actor, tenant, event type, date range",
          "Tamper-evident append-only storage",
          "CSV / JSONL export for compliance reviews",
          "Stream to your SIEM via webhooks",
        ]}
      />
    </>
  );
}
