"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatCompactCurrency } from "@/lib/format";
import type { RevenueByPlanPoint } from "@/lib/mocks/dashboard";

interface Props {
  data: RevenueByPlanPoint[];
}

const planColors: Record<"starter" | "growth" | "scale" | "enterprise", string> = {
  starter: "#94A3B8",
  growth: "#06B6D4",
  scale: "#6366F1",
  enterprise: "#8B5CF6",
};

export function RevenueChart({ data }: Props) {
  return (
    <ChartCard title="Revenue by plan" description="Stacked monthly recurring revenue">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number, name) => [formatCompactCurrency(v), name as string]}
            />
            <Bar dataKey="growth" stackId="rev" fill={planColors.growth} radius={[0, 0, 0, 0]} />
            <Bar dataKey="scale" stackId="rev" fill={planColors.scale} />
            <Bar dataKey="enterprise" stackId="rev" fill={planColors.enterprise} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
        <Legend color={planColors.growth} label="Growth" />
        <Legend color={planColors.scale} label="Scale" />
        <Legend color={planColors.enterprise} label="Enterprise" />
      </div>
    </ChartCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}
