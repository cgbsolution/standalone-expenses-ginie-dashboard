"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "./animated-number";
import { formatDelta } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KPICardProps {
  icon?: LucideIcon;
  label: string;
  value: number;
  format?: (value: number) => string;
  deltaPct?: number;
  spark?: number[];
  accent?: "primary" | "violet" | "cyan" | "success" | "warning";
  className?: string;
}

const accentMap = {
  primary: { ring: "from-primary/30 to-primary/0", stroke: "#6366F1" },
  violet: { ring: "from-violet-500/30 to-violet-500/0", stroke: "#8B5CF6" },
  cyan: { ring: "from-cyan-500/30 to-cyan-500/0", stroke: "#06B6D4" },
  success: { ring: "from-emerald-500/30 to-emerald-500/0", stroke: "#10B981" },
  warning: { ring: "from-amber-500/30 to-amber-500/0", stroke: "#F59E0B" },
};

export function KPICard({
  icon: Icon,
  label,
  value,
  format = (n) => n.toLocaleString(),
  deltaPct,
  spark,
  accent = "primary",
  className,
}: KPICardProps) {
  const a = accentMap[accent];
  const delta = deltaPct != null ? formatDelta(deltaPct) : null;
  const sparkData = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-card-light dark:shadow-card-dark",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-60",
          a.ring,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="tabular text-2xl font-semibold tracking-tight text-foreground">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        {Icon ? (
          <div className="rounded-lg border border-border bg-background/40 p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        {delta ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
              delta.sign > 0 && "bg-success/10 text-success",
              delta.sign < 0 && "bg-destructive/10 text-destructive",
              delta.sign === 0 && "bg-muted text-muted-foreground",
            )}
          >
            {delta.sign > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : delta.sign < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {delta.text}
          </div>
        ) : (
          <span />
        )}
        {sparkData.length > 1 ? (
          <div className="h-9 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={a.stroke}
                  strokeWidth={1.75}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
