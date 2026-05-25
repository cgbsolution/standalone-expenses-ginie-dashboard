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
  currency = "USD",
  compact = false,
  className,
}: CurrencyDisplayProps) {
  const text = compact ? formatCompactCurrency(value, currency) : formatCurrency(value, currency);
  return <span className={cn("tabular font-medium", className)}>{text}</span>;
}
