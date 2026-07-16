"use client";

import { useMemo, useState } from "react";
import { ScrollText, Search, Download } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllExpenses } from "@/lib/hooks/use-expenses";
import { formatDate } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";

type Log = { key: string; at: string; actor: string; event: string; target: string; amount: number };

function buildLogs(expenses: MasterExpense[]): Log[] {
  const logs: Log[] = [];
  for (const exp of expenses) {
    (exp.ApprovalHistory ?? []).forEach((h, i) => {
      logs.push({
        key: `${exp.id}-${i}`,
        at: h.at,
        actor: h.by,
        event: h.action_status || `${h.from} → ${h.to}`,
        target: exp.ExpenseTitle,
        amount: Number(exp.TotalAmount) || 0,
      });
    });
  }
  return logs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export default function AuditLogsPage() {
  const { data: expenses, isLoading } = useAllExpenses();
  const [q, setQ] = useState("");

  const logs = useMemo(() => {
    const all = buildLogs(expenses ?? []);
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter((l) => l.actor.toLowerCase().includes(t) || l.event.toLowerCase().includes(t) || l.target.toLowerCase().includes(t));
  }, [expenses, q]);

  const exportCsv = () => {
    const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows = logs.map((l) => [l.at, l.actor, l.event, l.target, l.amount].map(esc).join(","));
    const csv = ["Timestamp,Actor,Event,Target,Amount", ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Every workflow action across the platform"
        actions={<Button size="sm" variant="outline" onClick={exportCsv} disabled={!logs.length}><Download className="h-4 w-4" /> Export CSV</Button>}
      />

      <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Covers expense submissions, approvals, rejections, and finance routing. Login and role-change capture is a planned expansion.
      </div>

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search actor, event, expense…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit events yet" description="Workflow actions across all tenants will be logged here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Event</th>
                <th className="px-4 py-2.5 font-medium">Expense</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 200).map((l) => (
                <tr key={l.key} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{formatDate(l.at, "MMM d, HH:mm")}</td>
                  <td className="px-4 py-2.5 font-medium">{l.actor.split("@")[0]}</td>
                  <td className="px-4 py-2.5"><Badge variant="secondary">{l.event}</Badge></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
