export type Period = "this_month" | "last_month" | "30d" | "90d" | "this_year" | "all";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
];

const DAY = 24 * 60 * 60 * 1000;

export interface Range {
  start: number | null; // null = no lower bound (all time)
  end: number;
  label: string;
}

export function periodRange(p: Period): Range {
  const now = new Date();
  const end = now.getTime();
  const label = PERIODS.find((x) => x.value === p)?.label ?? "All time";
  switch (p) {
    case "this_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end, label };
    case "last_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(),
        end: new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1,
        label,
      };
    case "30d":
      return { start: end - 30 * DAY, end, label };
    case "90d":
      return { start: end - 90 * DAY, end, label };
    case "this_year":
      return { start: new Date(now.getFullYear(), 0, 1).getTime(), end, label };
    case "all":
    default:
      return { start: null, end, label };
  }
}

/** Is an ISO date inside the range? */
export function inRange(iso: string | undefined | null, r: Range): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (r.start != null && t < r.start) return false;
  return t <= r.end;
}

/** Concrete [start, end] millis for building a daily series (caps "all" at 1y). */
export function rangeBounds(r: Range): { startMs: number; endMs: number } {
  const endMs = r.end;
  const startMs = r.start ?? endMs - 365 * DAY;
  return { startMs, endMs };
}
