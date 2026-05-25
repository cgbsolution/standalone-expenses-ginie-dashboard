import { AlertCircle, Clock } from "lucide-react";
import { differenceInDays, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const AGING_OVERDUE_DAYS = 5;
const AGING_PENDING_DAYS = 2;

interface AgingIndicatorProps {
  submittedAt: string;
  /** When true, the indicator is shown only if the item is past SLA (>= overdue threshold). */
  onlyIfOverdue?: boolean;
  className?: string;
}

/**
 * "1d ago" (gray) → "{n}d pending" (amber) → "{n}d overdue" (red).
 * Thresholds:
 *   - up to 2 days: muted gray
 *   - 3-5 days: warning amber
 *   - 6+ days: destructive red
 */
export function AgingIndicator({ submittedAt, onlyIfOverdue, className }: AgingIndicatorProps) {
  const days = daysSince(submittedAt);
  if (days == null) return null;

  const isOverdue = days > AGING_OVERDUE_DAYS;
  const isPending = !isOverdue && days > AGING_PENDING_DAYS;

  if (onlyIfOverdue && !isOverdue) return null;

  if (isOverdue) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive",
          className,
        )}
      >
        <AlertCircle className="h-3 w-3" />
        {days}d overdue
      </span>
    );
  }
  if (isPending) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning",
          className,
        )}
      >
        <Clock className="h-3 w-3" />
        {days}d pending
      </span>
    );
  }
  return (
    <span className={cn("text-[11px] text-muted-foreground", className)}>
      {days <= 0 ? "just now" : `${days}d ago`}
    </span>
  );
}

export function isOverdue(submittedAt: string): boolean {
  const days = daysSince(submittedAt);
  return days != null && days > AGING_OVERDUE_DAYS;
}

export function daysSince(value: string): number | null {
  const d = parseISO(value);
  if (!isValid(d)) return null;
  return differenceInDays(new Date(), d);
}
