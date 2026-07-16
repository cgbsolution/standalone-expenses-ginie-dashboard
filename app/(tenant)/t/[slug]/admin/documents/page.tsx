"use client";

import { useMemo, useState } from "react";
import { FileText, Search, Download, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAllExpenses } from "@/lib/hooks/use-expenses";
import apiClient from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { MasterExpense } from "@/types/expense";

type Doc = {
  key: string;
  title: string;
  vendor: string;
  amount: number;
  date: string;
  submitter: string;
  status: MasterExpense["ApprovalStatus"];
  receiptUrl: string;
};

function buildDocs(expenses: MasterExpense[]): Doc[] {
  const docs: Doc[] = [];
  for (const exp of expenses) {
    (exp.ExpenseData ?? []).forEach((inv, i) => {
      if (!inv.ReceiptUrl) return;
      docs.push({
        key: `${exp.id}-${i}`,
        title: exp.ExpenseTitle,
        vendor: inv.VendorName || inv.Category || "—",
        amount: Number(inv.InvoiceAmount) || 0,
        date: inv.DocumentDate || exp.SubmissionDate,
        submitter: exp.SubmitterName || exp.SubmitterEmail,
        status: exp.ApprovalStatus,
        receiptUrl: inv.ReceiptUrl,
      });
    });
  }
  return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function DocumentsPage() {
  const { data: expenses, isLoading } = useAllExpenses();
  const [q, setQ] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  const docs = useMemo(() => {
    const all = buildDocs(expenses ?? []);
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (d) => d.title.toLowerCase().includes(term) || d.vendor.toLowerCase().includes(term) || d.submitter.toLowerCase().includes(term),
    );
  }, [expenses, q]);

  const open = async (d: Doc) => {
    setOpening(d.key);
    try {
      let url = d.receiptUrl;
      if (!/^https?:\/\//i.test(url)) {
        const { data } = await apiClient.get<{ url: string }>("/storage/sign", { params: { path: d.receiptUrl } });
        url = data.url;
      }
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not open this receipt.");
    } finally {
      setOpening(null);
    }
  };

  return (
    <>
      <PageHeader title="Documents" description="Every receipt attached across your team" />

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search receipts, vendor, person…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No receipts yet" description="Receipts attached to submitted expenses will appear here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Expense</th>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 font-medium">Submitter</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.key} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{d.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.vendor}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.submitter}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(d.date)}</td>
                  <td className="px-4 py-2.5 text-right"><CurrencyDisplay value={d.amount} currency="INR" /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="outline" size="sm" onClick={() => open(d)} disabled={opening === d.key}>
                      {opening === d.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
