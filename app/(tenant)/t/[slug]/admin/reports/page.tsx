import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate, schedule, and export expense reports"
      />
      <ComingSoon
        icon={FileBarChart}
        title="Report builder"
        bullets={[
          "Pre-built reports: monthly spend by category, per-employee breakdown, reimbursement aging",
          "Custom reports with column picker, filters, and groupings",
          "Schedule reports to email at any cadence",
          "Export to CSV, XLSX, PDF",
          "Save report templates for the whole team",
        ]}
      />
    </>
  );
}
