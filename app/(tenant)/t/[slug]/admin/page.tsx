"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Receipt, ShieldCheck, Sparkles, TrendingUp, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/components/shared/period-filter";
import { useTenantExpenses } from "@/lib/hooks/use-expenses";
import { useCategories } from "@/lib/hooks/use-categories";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { SpendingTrend } from "@/components/admin/spending-trend";
import { CategoryDonut } from "@/components/admin/category-donut";
import { RecentExpenses } from "@/components/admin/recent-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { expenseTotal, expenseCategory } from "@/lib/expense";
import { periodRange, rangeBounds, inRange, type Period, type Range } from "@/lib/period";
import type { MasterExpense, Category } from "@/types/expense";
import type { SpendTrendPoint } from "@/lib/mocks/dashboard";

interface PageProps {
  params: { slug: string };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PALETTE = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

// Daily submissions (spend) + approvals (reimbursed) across the selected range,
// capped at ~180 daily points for readability.
function buildTrend(expenses: MasterExpense[], range: Range): SpendTrendPoint[] {
  const { startMs, endMs } = rangeBounds(range);
  const startDay = new Date(startMs); startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endMs); endDay.setHours(0, 0, 0, 0);
  let count = Math.floor((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1;
  count = Math.max(1, Math.min(count, 180));
  const first = endDay.getTime() - (count - 1) * DAY_MS;
  const days: SpendTrendPoint[] = Array.from({ length: count }, (_, i) => ({
    date: new Date(first + i * DAY_MS).toISOString(),
    spend: 0,
    reimbursed: 0,
  }));
  const bucket = (iso?: string) => {
    if (!iso) return -1;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return -1;
    d.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - first) / DAY_MS);
  };
  for (const e of expenses) {
    const amt = expenseTotal(e);
    const submitted = days[bucket(e.SubmissionDate)];
    if (submitted) submitted.spend += amt;
    const approved = days[bucket(e.ApprovedAt)];
    if (approved) approved.reimbursed += amt;
  }
  return days;
}

// Real spend per category, merged with the configured category budgets.
function buildCategories(expenses: MasterExpense[], defined: { id: string; name: string; color: string; icon: string; monthlyBudget: number }[]): Category[] {
  const spent = new Map<string, number>();
  for (const e of expenses) {
    const name = expenseCategory(e);
    spent.set(name, (spent.get(name) || 0) + expenseTotal(e));
  }
  const out: Category[] = defined.map((c) => ({
    id: c.id, name: c.name, color: c.color, icon: c.icon,
    monthlyBudget: c.monthlyBudget, spent: spent.get(c.name) || 0,
  }));
  let i = 0;
  for (const [name, amount] of spent) {
    if (!defined.some((c) => c.name === name)) {
      out.push({ id: name, name, color: PALETTE[(defined.length + i++) % PALETTE.length] ?? "#6366F1", icon: "folder", monthlyBudget: 0, spent: amount });
    }
  }
  return out.sort((a, b) => b.spent - a.spent);
}

export default function TenantAdminDashboardPage({ params }: PageProps) {
  const { slug } = params;

  // Tenant-admin view: every expense across all users in the tenant.
  const { data: expenses, isLoading } = useTenantExpenses(slug);
  const { data: definedCategories } = useCategories(slug);
  const [period, setPeriod] = useState<Period>("this_month");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const list = expenses ?? [];
    const range = periodRange(period);
    // Everything is scoped to the selected period, including pending.
    const inPeriod = list.filter((e) => inRange(e.SubmissionDate, range));
    const pending = inPeriod.filter((e) => e.ApprovalStatus === "Pending");
    return {
      periodLabel: range.label,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, e) => s + expenseTotal(e), 0),
      volume: inPeriod.reduce((s, e) => s + expenseTotal(e), 0),
      approved: inPeriod
        .filter((e) => e.ApprovalStatus === "Approved")
        .reduce((s, e) => s + expenseTotal(e), 0),
      trend: buildTrend(list, range),
      categories: buildCategories(inPeriod, definedCategories ?? []),
    };
  }, [expenses, definedCategories, period]);

  // Snapshot the current dashboard (cards + charts) into a paginated A4 PDF.
  async function downloadPdf() {
    const node = reportRef.current;
    if (!node) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const img = canvas.toDataURL("image/png");
      let heightLeft = imgH;
      let pos = 0;
      pdf.addImage(img, "PNG", 0, pos, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        pos -= pageH;
        pdf.addPage();
        pdf.addImage(img, "PNG", 0, pos, imgW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`${slug}-dashboard-${period}.pdf`);
    } catch {
      toast.error("Could not generate the PDF.");
    } finally {
      setExporting(false);
    }
  }

  const p = stats.periodLabel;
  const kpis = [
    { label: `Volume · ${p}`, icon: Receipt, node: <CurrencyDisplay value={stats.volume} compact /> },
    { label: `Pending · ${p}`, icon: ShieldCheck, node: <span>{stats.pendingCount}</span> },
    { label: `Pending amount · ${p}`, icon: Sparkles, node: <CurrencyDisplay value={stats.pendingAmount} compact /> },
    { label: `Approved · ${p}`, icon: TrendingUp, node: <CurrencyDisplay value={stats.approved} compact /> },
  ];

  return (
    <>
      <WelcomeBanner slug={slug} pending={stats.pendingCount} />

      <PageHeader
        title="Dashboard"
        description="Track spend, approvals and reimbursements at a glance"
        actions={
          <>
            <PeriodFilter value={period} onChange={setPeriod} />
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={exporting || isLoading}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
          </>
        }
      />

      <div ref={reportRef} className="space-y-6 bg-background">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : kpis.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <k.icon className="h-4 w-4" /> {k.label}
                  </div>
                  <div className="text-xl font-semibold">{k.node}</div>
                </div>
              ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-[340px] lg:col-span-2" />
              <Skeleton className="h-[340px]" />
            </>
          ) : (
            <>
              <SpendingTrend data={stats.trend} />
              <CategoryDonut categories={stats.categories} subtitle={stats.periodLabel} />
            </>
          )}
        </section>

        <section>
          <RecentExpenses expenses={expenses ?? []} slug={slug} />
        </section>
      </div>
    </>
  );
}

function WelcomeBanner({ slug, pending }: { slug: string; pending: number }) {
  const name = useAuthStore((s) => s.session?.user.givenName ?? "there");
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-card-light dark:shadow-card-dark">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
            {slug.toUpperCase()} workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Hey {name}, here's your day.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending > 0
              ? `${pending} ${pending === 1 ? "expense needs" : "expenses need"} your decision. Stay sharp.`
              : "No approvals pending — you're all caught up."}
          </p>
        </div>
        <Button asChild size="sm" variant="default" className="shrink-0">
          <Link href={`/t/${slug}/admin/approvals`}>
            {pending > 0 ? `Review ${pending} pending` : "Review approvals"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
