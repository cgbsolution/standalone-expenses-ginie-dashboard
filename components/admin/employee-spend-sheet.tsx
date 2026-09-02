"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Clock, Download, Receipt, Wallet, XCircle } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMyExpenses } from "@/lib/hooks/use-expenses";
import { expenseCategory, expenseTotal } from "@/lib/expense";
import {
  GRANULARITIES,
  claimsInWindow,
  spendByCategory,
  spendSeries,
  spendSummary,
  type Granularity,
  type SpendBucket,
} from "@/lib/analytics";
import { formatCompactCurrency, formatCurrency, formatDate, formatRelative } from "@/lib/format";
import type { User } from "@/types/auth";
import type { MasterExpense } from "@/types/expense";

// Chart marks come from CSS variables so both themes are handled by the
// stylesheet — see the --chart-* tokens in globals.css for how they were picked.
const APPROVED = "hsl(var(--chart-approved))";
const PENDING = "hsl(var(--chart-pending))";
const SURFACE = "hsl(var(--card))";
const INK = "hsl(var(--muted-foreground))";

/** Categories past this fold into "Other" rather than growing an unreadable axis. */
const CATEGORY_LIMIT = 7;

export function EmployeeSpendSheet({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [granularity, setGranularity] = useState<Granularity>("monthly");

  // Only fetches while the sheet is open; react-query then caches per employee,
  // so re-opening the same person is instant.
  const { data: expenses, isLoading } = useMyExpenses(open && user ? user.email : "");

  const view = useMemo(() => {
    const all = expenses ?? [];
    const series = spendSeries(all, granularity);
    const claims = claimsInWindow(all, series);
    return {
      all,
      series,
      claims,
      summary: spendSummary(claims),
      lifetime: spendSummary(all),
      categories: foldCategories(spendByCategory(claims)),
      hasBars: series.buckets.some((b) => b.count > 0),
    };
  }, [expenses, granularity]);

  if (!user) return null;

  const periodLabel = GRANULARITIES.find((g) => g.value === granularity)?.label ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="sr-only">{user.displayName}&apos;s spend</SheetTitle>
          <SheetDescription className="sr-only">
            Claim totals and trends for this employee.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-3">
          <UserAvatar name={user.displayName} src={user.avatarUrl ?? undefined} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold">{user.displayName}</h2>
              <Badge variant={user.role === "admin" ? "default" : "muted"}>
                {user.role === "admin" ? "Admin" : "Employee"}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
              {user.department ? ` · ${user.department}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <TabsList className="h-8 p-0.5">
              {GRANULARITIES.map((g) => (
                <TabsTrigger key={g.value} value={g.value} className="h-7 px-2.5 text-[11px]">
                  {g.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            disabled={!view.claims.length}
            onClick={() => downloadCsv(user, view.claims, periodLabel)}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[74px]" />
              ))}
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        ) : !view.all.length ? (
          <div className="mt-6">
            <EmptyState
              icon={Receipt}
              title="No claims yet"
              description={`${user.displayName} hasn't submitted an expense.`}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                icon={Wallet}
                label="Claimed"
                value={view.summary.claimed}
                tone="neutral"
                hint={`${view.summary.count} claim${view.summary.count === 1 ? "" : "s"}`}
              />
              <StatTile
                icon={CheckCircle2}
                label="Approved"
                value={view.summary.approved}
                tone="approved"
              />
              <StatTile
                icon={Clock}
                label="Pending"
                value={view.summary.pending}
                tone="pending"
              />
              <StatTile
                icon={XCircle}
                label="Rejected"
                value={view.summary.rejected}
                tone="rejected"
              />
            </section>

            <SectionCard
              title="Spend over time"
              description={`${periodLabel} · approved and pending claims`}
              bodyClassName="pt-1"
            >
              {view.hasBars ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={view.series.buckets}
                        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="hsl(var(--border))"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          stroke={INK}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                          minTickGap={8}
                        />
                        <YAxis
                          stroke={INK}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={62}
                          tickFormatter={(v: number) => formatCompactCurrency(v)}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                          content={<SpendTooltip />}
                        />
                        {/* The 2px surface-coloured stroke is what puts a visible
                            gap between the two stacked segments. */}
                        <Bar
                          dataKey="approved"
                          stackId="spend"
                          fill={APPROVED}
                          stroke={SURFACE}
                          strokeWidth={2}
                          maxBarSize={44}
                        />
                        <Bar
                          dataKey="pending"
                          stackId="spend"
                          fill={PENDING}
                          stroke={SURFACE}
                          strokeWidth={2}
                          maxBarSize={44}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
                    <Key color={APPROVED} label="Approved" />
                    <Key color={PENDING} label="Pending" />
                    <span className="text-[11px]">Rejected claims are excluded — they never cost anything.</span>
                  </div>
                </>
              ) : (
                <p className="py-10 text-center text-xs text-muted-foreground">
                  No claims in this window. Lifetime spend is{" "}
                  <CurrencyDisplay value={view.lifetime.claimed} className="text-foreground" /> across{" "}
                  {view.lifetime.count} claim{view.lifetime.count === 1 ? "" : "s"} — switch to{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => setGranularity("all")}
                  >
                    All time
                  </button>{" "}
                  to see them.
                </p>
              )}
            </SectionCard>

            {view.categories.length ? (
              <SectionCard
                title="Where it goes"
                description="Approved and pending claims by category"
                bodyClassName="pt-1"
              >
                <div style={{ height: Math.max(140, view.categories.length * 34 + 16) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={view.categories}
                      margin={{ top: 4, right: 64, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={INK}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} content={<CategoryTooltip />} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        <LabelList
                          dataKey="total"
                          position="right"
                          fill={INK}
                          fontSize={11}
                          formatter={(v: number) => formatCompactCurrency(v)}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard
              title="Claims"
              description={`${view.claims.length} in this window · ${view.lifetime.count} lifetime`}
            >
              {view.claims.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-left uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2 pr-3 font-medium">Title</th>
                        <th className="pb-2 pr-3 font-medium">Category</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 pr-3 font-medium">Submitted</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.claims.slice(0, 25).map((e) => (
                        <tr key={e.id} className="border-b border-border/40 last:border-0">
                          <td className="max-w-[180px] truncate py-2 pr-3 font-medium">{e.ExpenseTitle}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{expenseCategory(e)}</td>
                          <td className="py-2 pr-3">
                            <StatusBadge status={e.ApprovalStatus} />
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">{formatDate(e.SubmissionDate)}</td>
                          <td className="py-2 text-right">
                            <CurrencyDisplay value={expenseTotal(e)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {view.claims.length > 25 ? (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Showing the 25 most recent — export for the full list.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nothing submitted in this window.
                </p>
              )}
            </SectionCard>

            {view.lifetime.lastAt ? (
              <p className="pb-2 text-center text-[11px] text-muted-foreground">
                Last claim {formatRelative(view.lifetime.lastAt)} ·{" "}
                <CurrencyDisplay value={view.lifetime.avg} /> average
              </p>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const toneClass = {
  neutral: "text-foreground",
  approved: "text-[hsl(var(--chart-approved))]",
  pending: "text-[hsl(var(--chart-pending))]",
  rejected: "text-[hsl(var(--chart-rejected))]",
} as const;

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  tone: keyof typeof toneClass;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${toneClass[tone]}`}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold">
        <CurrencyDisplay value={value} compact />
      </div>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const tooltipShell =
  "rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg";

function SpendTooltip({ active, payload }: { active?: boolean; payload?: { payload: SpendBucket }[] }) {
  const bucket = active ? payload?.[0]?.payload : undefined;
  if (!bucket) return null;
  return (
    <div className={tooltipShell}>
      <p className="font-medium">{bucket.label}</p>
      <dl className="mt-1.5 space-y-1">
        <TooltipRow color={APPROVED} label="Approved" value={bucket.approved} />
        <TooltipRow color={PENDING} label="Pending" value={bucket.pending} />
      </dl>
      <p className="mt-1.5 border-t border-border/60 pt-1.5 text-muted-foreground">
        {formatCurrency(bucket.spend)} · {bucket.count} claim{bucket.count === 1 ? "" : "s"}
        {bucket.rejected > 0 ? ` · ${formatCurrency(bucket.rejected)} rejected` : ""}
      </p>
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; total: number; count: number } }[];
}) {
  const slice = active ? payload?.[0]?.payload : undefined;
  if (!slice) return null;
  return (
    <div className={tooltipShell}>
      <p className="font-medium">{slice.name}</p>
      <p className="mt-1 text-muted-foreground">
        {formatCurrency(slice.total)} · {slice.count} claim{slice.count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto font-medium">{formatCurrency(value)}</dd>
    </div>
  );
}

function foldCategories(slices: { name: string; total: number; count: number }[]) {
  if (slices.length <= CATEGORY_LIMIT) return slices;
  const head = slices.slice(0, CATEGORY_LIMIT - 1);
  const rest = slices.slice(CATEGORY_LIMIT - 1);
  return [
    ...head,
    {
      name: `Other (${rest.length})`,
      total: rest.reduce((s, c) => s + c.total, 0),
      count: rest.reduce((s, c) => s + c.count, 0),
    },
  ];
}

function downloadCsv(user: User, claims: MasterExpense[], periodLabel: string) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Expense ID", "Title", "Category", "Status", "Submitted", "Amount (INR)"];
  const rows = claims.map((e) =>
    [
      e.ExpenseId,
      e.ExpenseTitle,
      expenseCategory(e),
      e.ApprovalStatus,
      e.SubmissionDate,
      expenseTotal(e),
    ]
      .map(esc)
      .join(","),
  );
  const csv = [head.map(esc).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${user.email.split("@")[0]}-spend-${periodLabel.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
