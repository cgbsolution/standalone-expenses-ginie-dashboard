import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types/common";

export type AmountTier = "low" | "mid" | "high";

const THRESHOLDS = {
  /** Under this is "low" — auto-approve candidate territory. */
  low: 500,
  /** Under this is "mid" — routine. Above is "high" — needs attention. */
  mid: 5000,
};

export function tierFor(amount: number): AmountTier {
  if (amount < THRESHOLDS.low) return "low";
  if (amount < THRESHOLDS.mid) return "mid";
  return "high";
}

const TIER_TEXT_CLASS: Record<AmountTier, string> = {
  low: "text-success",
  mid: "text-warning",
  high: "text-destructive",
};

interface TieredAmountProps {
  amount: number;
  currency?: Currency;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Colored, color-tiered amount label. Use on dense lists where instant scanning
 * matters more than chart-style precision — approvals queue, recent expenses,
 * activity feeds.
 */
export function TieredAmount({ amount, currency = "USD", className, size = "md" }: TieredAmountProps) {
  const tier = tierFor(amount);
  const sizeClass = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  return (
    <CurrencyDisplay
      value={amount}
      currency={currency}
      className={cn(sizeClass, "font-semibold", TIER_TEXT_CLASS[tier], className)}
    />
  );
}
