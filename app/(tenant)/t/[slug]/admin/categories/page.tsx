import { Folder } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Expense categories, monthly budgets, color and icon"
      />
      <ComingSoon
        icon={Folder}
        title="Category management"
        bullets={[
          "CRUD with color picker and icon selector",
          "Per-category monthly budget caps with rollover rules",
          "Map categories to GL accounts for accounting export",
          "Department-level overrides",
          "Bulk re-categorize tool for historical expenses",
        ]}
      />
    </>
  );
}
