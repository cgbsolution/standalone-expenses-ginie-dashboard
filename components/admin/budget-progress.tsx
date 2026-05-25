"use client";

import { SectionCard } from "@/components/shared/section-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/expense";

interface Props {
  categories: Category[];
}

export function BudgetProgress({ categories }: Props) {
  return (
    <SectionCard
      title="Budget vs actual"
      description="Per category — this month"
    >
      <ul className="space-y-4">
        {categories.map((c) => {
          const pct = Math.min(100, Math.round((c.spent / c.monthlyBudget) * 100));
          const danger = pct >= 90;
          const warn = !danger && pct >= 75;
          return (
            <li key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className="tabular text-muted-foreground">
                  <CurrencyDisplay value={c.spent} compact className="text-foreground" /> /{" "}
                  <CurrencyDisplay value={c.monthlyBudget} compact />
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700",
                    danger
                      ? "bg-gradient-to-r from-destructive to-rose-500"
                      : warn
                        ? "bg-gradient-to-r from-warning to-amber-500"
                        : "bg-gradient-to-r from-primary to-violet-500",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
