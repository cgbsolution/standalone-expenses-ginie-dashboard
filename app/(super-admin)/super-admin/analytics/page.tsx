import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Platform-wide analytics across every tenant"
      />
      <ComingSoon
        icon={BarChart3}
        title="Cross-tenant analytics"
        bullets={[
          "Cohort retention by signup month",
          "Funnel: signup → first expense → first approval",
          "Plan-mix evolution and ARR forecasting",
          "Expense category trends across the whole platform",
          "Geographic spread and adoption hotspots",
        ]}
      />
    </>
  );
}
