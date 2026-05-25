"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SectionCard } from "@/components/shared/section-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatCurrency } from "@/lib/format";
import type { Category } from "@/types/expense";

interface Props {
  categories: Category[];
}

export function CategoryDonut({ categories }: Props) {
  const data = categories.map((c) => ({ name: c.name, value: c.spent, color: c.color }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <SectionCard title="Category breakdown" description="This month so far">
      <div className="relative flex items-center justify-center">
        <div className="h-56 w-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, name) => [formatCurrency(v), name as string]}
              />
              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
          <CurrencyDisplay value={total} className="text-2xl font-semibold" />
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {data.slice(0, 6).map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
            <CurrencyDisplay value={d.value} compact className="tabular text-foreground" />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
