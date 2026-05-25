import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Plans, invoices, payment methods, MRR breakdown across tenants"
      />
      <ComingSoon
        icon={CreditCard}
        title="Billing console"
        bullets={[
          "Plans editor — create, archive, change pricing",
          "Per-tenant invoices with line items + PDF export",
          "Stripe / Razorpay integration for collection",
          "Dunning workflows for failed payments",
          "Revenue and churn analytics",
        ]}
      />
    </>
  );
}
