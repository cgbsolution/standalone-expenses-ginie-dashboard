"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { GenieChat } from "@/components/expenses/genie-chat";
import { Button } from "@/components/ui/button";

export default function SubmitExpensePage({ params }: { params: { slug: string } }) {
  return (
    <>
      <PageHeader
        title="Submit expense"
        description="Upload a receipt or describe the expense. Genie does the rest, same as the mobile app"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/t/${params.slug}/employee/expenses`}>
              <Receipt className="h-4 w-4" />
              My expenses
            </Link>
          </Button>
        }
      />
      <GenieChat />
    </>
  );
}
