import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { Currency } from "@/types/common";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
  value: number,
  currency: Currency = "USD",
  locale = "en-US",
): string {
  const key = `${locale}:${currency}`;
  let f = currencyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(key, f);
  }
  return f.format(value);
}

export function formatCompactCurrency(
  value: number,
  currency: Currency = "USD",
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCompactNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatPercent(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function safeDate(value: string | Date | number): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | number, pattern = "MMM d, yyyy"): string {
  const d = safeDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatDateTime(value: string | Date | number): string {
  const d = safeDate(value);
  return d ? format(d, "MMM d, yyyy · h:mm a") : "—";
}

export function formatRelative(value: string | Date | number): string {
  const d = safeDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

export function formatDelta(value: number): { text: string; sign: 1 | 0 | -1 } {
  if (value === 0) return { text: "0%", sign: 0 };
  const sign = value > 0 ? 1 : -1;
  return {
    text: `${value > 0 ? "+" : ""}${value.toFixed(1)}%`,
    sign,
  };
}
