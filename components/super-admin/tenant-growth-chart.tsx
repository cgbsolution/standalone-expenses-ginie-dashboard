"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatCompactNumber } from "@/lib/format";
import type { TenantGrowthPoint } from "@/lib/mocks/dashboard";

interface Props {
  data: TenantGrowthPoint[];
}

export function TenantGrowthChart({ data }: Props) {
  return (
    <ChartCard
      title="Tenant growth"
      description="Total vs active over the last 12 months"
      className="lg:col-span-2"
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="tenantsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v: number) => formatCompactNumber(v)}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.25 }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="tenants"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#tenantsGrad)"
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="active"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#activeGrad)"
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Tenants
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-500" /> Active
        </span>
      </div>
    </ChartCard>
  );
}
