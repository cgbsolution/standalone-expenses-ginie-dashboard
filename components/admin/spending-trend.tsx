"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import type { TimeRange } from "@/lib/constants";
import type { SpendTrendPoint } from "@/lib/mocks/dashboard";

interface Props {
  data: SpendTrendPoint[];
}

export function SpendingTrend({ data }: Props) {
  const [range, setRange] = useState<TimeRange>("30D");
  const sliced = sliceForRange(data, range);

  return (
    <ChartCard
      title="Spending trend"
      description="Submitted vs reimbursed"
      rangeValue={range}
      onRangeChange={setRange}
      showRange
      className="lg:col-span-2"
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sliced} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d: string) => formatDate(d, "MMM d")}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.25 }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number, name) => [formatCurrency(v), name as string]}
              labelFormatter={(label: string) => formatDate(label, "EEE, MMM d")}
            />
            <Line
              type="monotone"
              dataKey="spend"
              name="Spend"
              stroke="#6366F1"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="reimbursed"
              name="Reimbursed"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Spend
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Reimbursed
        </span>
      </div>
    </ChartCard>
  );
}

function sliceForRange(data: SpendTrendPoint[], range: TimeRange): SpendTrendPoint[] {
  const days = range === "7D" ? 7 : range === "30D" ? 30 : range === "90D" ? 90 : 365;
  return data.slice(-Math.min(days, data.length));
}
