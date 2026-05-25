import { Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        title="Activity"
        description="A live feed of every action across your workspace"
      />
      <ComingSoon
        icon={Activity}
        title="Workspace activity feed"
        bullets={[
          "Submissions, approvals, rejections, comments, status changes",
          "Filter by actor, expense, date range",
          "Reverse-chronological with sticky day headers",
          "Subscribe to specific event types via email or webhook",
        ]}
      />
    </>
  );
}
