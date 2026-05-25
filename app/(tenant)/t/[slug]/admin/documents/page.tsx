import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Receipts, invoices, and policy attachments — one search bar"
      />
      <ComingSoon
        icon={FileText}
        title="Document hub"
        bullets={[
          "Unified view across receipts, invoices, policy PDFs",
          "OCR full-text search inside scanned receipts",
          "Bulk download by date range",
          "Retention policies aligned with local tax law",
          "Permission scopes — admin-only, finance-only, employee-self",
        ]}
      />
    </>
  );
}
