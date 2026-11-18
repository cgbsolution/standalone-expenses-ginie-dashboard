"use client";

import { PageHeader } from "@/components/shared/page-header";
import { GenieChat } from "@/components/expenses/genie-chat";

// Admins are also employees with their own claims, but the middleware keeps
// them out of /employee/*, so they get the same chat here.
export default function AdminSubmitExpensePage() {
  return (
    <>
      <PageHeader
        title="Submit expense"
        description="Submit your own expense. Upload a receipt or describe it, same as the mobile app"
      />
      <GenieChat />
    </>
  );
}
