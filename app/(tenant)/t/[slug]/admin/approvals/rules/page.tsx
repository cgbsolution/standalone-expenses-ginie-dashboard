import { Workflow } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function ApprovalRulesPage() {
  return (
    <>
      <PageHeader
        title="Approval rules"
        description="Auto-route or auto-approve expenses based on policy"
      />
      <ComingSoon
        icon={Workflow}
        title="Rules engine"
        bullets={[
          "Conditions: amount, category, department, submitter grade",
          "Actions: auto-approve, auto-reject, route to N approvers, escalate after X hours",
          "Multi-step approval chains with parallel or sequential gates",
          "Sandbox mode to dry-run rules against historical expenses",
          "Audit log of every rule decision",
        ]}
      />
    </>
  );
}
