"use client";

import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { Currency } from "@/types/common";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  value: number;
  currency?: Currency;
  compact?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  value,
  currency = "INR",
  compact = false,
  className,
}: CurrencyDisplayProps) {
  // Guard against NaN/undefined so amounts never render as "₹NaN".
  const n = Number.isFinite(value) ? value : 0;
  const text = compact
    ? formatCompactCurrency(n, currency, "en-IN")
    : formatCurrency(n, currency, "en-IN");
  return <span className={cn("tabular font-medium", className)}>{text}</span>;
}
