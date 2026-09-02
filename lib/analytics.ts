import {
  differenceInCalendarMonths,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
} from "date-fns";

import { expenseCategory, expenseTotal } from "@/lib/expense";
import type { MasterExpense } from "@/types/expense";

export type Granularity = "weekly" | "monthly" | "yearly" | "all";

export const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "all", label: "All time" },
];

/** One column of the spend chart. Empty periods are kept, not skipped. */
export interface SpendBucket {
  key: string;
  label: string;
  approved: number;
  pending: number;
  rejected: number;
  /** Approved + pending — money the company is actually on the hook for. */
  spend: number;
  count: number;
}

export interface SpendSummary {
  /** Everything submitted, rejected claims included. */
  claimed: number;
  approved: number;
  pending: number;
  rejected: number;
  count: number;
  avg: number;
  lastAt: string | null;
}

export type Unit = "week" | "month" | "year";

/** A bucketed series plus the window it covers, so callers can filter to match. */
export interface SpendSeries {
  unit: Unit;
  /** Bucket-aligned inclusive window. */
  from: Date;
  to: Date;
  buckets: SpendBucket[];
}

const UNITS: Record<
  Unit,
  { start: (d: Date) => Date; each: (start: Date, end: Date) => Date[]; label: (d: Date) => string }
> = {
  // Weeks start Monday — an Indian finance week, not a US Sunday one.
  week: {
    start: (d) => startOfWeek(d, { weekStartsOn: 1 }),
    each: (start, end) => eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }),
    label: (d) => format(d, "d MMM"),
  },
  month: {
    start: startOfMonth,
    each: (start, end) => eachMonthOfInterval({ start, end }),
    label: (d) => format(d, "MMM yy"),
  },
  year: {
    start: startOfYear,
    each: (start, end) => eachYearOfInterval({ start, end }),
    label: (d) => format(d, "yyyy"),
  },
};

function submittedAt(e: MasterExpense): Date | null {
  const d = new Date(e.SubmissionDate);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Bucket an employee's claims into a time series the chart can render.
 *
 * "Weekly" and "Monthly" are trailing windows ending today, so an empty result
 * is a real answer ("nothing claimed lately") rather than a bug. "Yearly" and
 * "All time" span the data itself, and "All time" picks the unit that keeps the
 * bar count readable instead of drawing 200 slivers.
 */
export function spendSeries(expenses: MasterExpense[], g: Granularity): SpendSeries {
  const dated = expenses
    .map((e) => ({ e, at: submittedAt(e) }))
    .filter((x): x is { e: MasterExpense; at: Date } => x.at !== null);

  const now = new Date();
  let unit: Unit;
  let from: Date;
  let to = now;

  if (g === "weekly") {
    unit = "week";
    from = subWeeks(now, 11);
  } else if (g === "monthly") {
    unit = "month";
    from = subMonths(now, 11);
  } else {
    if (!dated.length) return { unit: "month", from: now, to: now, buckets: [] };
    const first = new Date(Math.min(...dated.map((d) => d.at.getTime())));
    const last = new Date(Math.max(...dated.map((d) => d.at.getTime()), now.getTime()));
    if (g === "yearly") {
      unit = "year";
    } else {
      // All time: short histories read better week-by-week, long ones by year.
      const months = differenceInCalendarMonths(last, first);
      unit = months <= 3 ? "week" : months <= 23 ? "month" : "year";
    }
    from = first;
    to = last;
  }

  const { start, each, label } = UNITS[unit];
  const windowFrom = start(from);
  // Local yyyy-MM-dd, not toISOString — a UTC key would shift the bucket by a
  // day for anyone east of Greenwich and drop claims into the wrong column.
  const keyOf = (d: Date) => format(start(d), "yyyy-MM-dd");

  const buckets = new Map<string, SpendBucket>();
  for (const d of each(windowFrom, to)) {
    const key = format(d, "yyyy-MM-dd");
    buckets.set(key, {
      key,
      label: label(d),
      approved: 0,
      pending: 0,
      rejected: 0,
      spend: 0,
      count: 0,
    });
  }

  for (const { e, at } of dated) {
    const b = buckets.get(keyOf(at));
    if (!b) continue; // outside the window
    const amount = expenseTotal(e);
    if (e.ApprovalStatus === "Approved") b.approved += amount;
    else if (e.ApprovalStatus === "Rejected") b.rejected += amount;
    // Draft sits with Pending: it is money the employee still intends to claim.
    else b.pending += amount;
    b.spend = b.approved + b.pending;
    b.count += 1;
  }

  return { unit, from: windowFrom, to, buckets: Array.from(buckets.values()) };
}

/** Headline totals across whatever set of claims is passed in. */
export function spendSummary(expenses: MasterExpense[]): SpendSummary {
  const s: SpendSummary = {
    claimed: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    count: expenses.length,
    avg: 0,
    lastAt: null,
  };
  let lastMs = -Infinity;

  for (const e of expenses) {
    const amount = expenseTotal(e);
    s.claimed += amount;
    if (e.ApprovalStatus === "Approved") s.approved += amount;
    else if (e.ApprovalStatus === "Rejected") s.rejected += amount;
    else s.pending += amount;

    const at = submittedAt(e);
    if (at && at.getTime() > lastMs) {
      lastMs = at.getTime();
      s.lastAt = e.SubmissionDate;
    }
  }

  s.avg = s.count ? s.claimed / s.count : 0;
  return s;
}

export interface CategorySlice {
  name: string;
  total: number;
  count: number;
}

/** Spend per category, biggest first. Rejected claims are left out — they never cost anything. */
export function spendByCategory(expenses: MasterExpense[]): CategorySlice[] {
  const map = new Map<string, CategorySlice>();
  for (const e of expenses) {
    if (e.ApprovalStatus === "Rejected") continue;
    const name = expenseCategory(e);
    const cur = map.get(name) ?? { name, total: 0, count: 0 };
    cur.total += expenseTotal(e);
    cur.count += 1;
    map.set(name, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/**
 * The claims a series is drawn from, newest first — so the table under the
 * chart shows exactly the rows the bars add up to.
 */
export function claimsInWindow(expenses: MasterExpense[], series: SpendSeries): MasterExpense[] {
  if (!series.buckets.length) return [];
  const fromMs = series.from.getTime();
  const toMs = series.to.getTime();
  return expenses
    .filter((e) => {
      const at = submittedAt(e);
      return !!at && at.getTime() >= fromMs && at.getTime() <= toMs;
    })
    .sort((a, b) => new Date(b.SubmissionDate).getTime() - new Date(a.SubmissionDate).getTime());
}
