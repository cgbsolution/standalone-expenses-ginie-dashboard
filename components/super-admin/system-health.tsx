"use client";

import { Activity, Database, ListChecks } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { formatRelative } from "@/lib/format";
import type { SystemHealthMetric } from "@/types/tenant";

export function SystemHealth({ metrics }: { metrics: SystemHealthMetric }) {
  return (
    <SectionCard title="System health" description="Live platform metrics">
      <ul className="space-y-4">
        <Row
          icon={<Activity className="h-4 w-4 text-success" />}
          label="API uptime"
          value={`${metrics.apiUptimePct.toFixed(2)}%`}
          status="success"
        />
        <Row
          icon={<ListChecks className="h-4 w-4 text-warning" />}
          label="Queue depth"
          value={metrics.queueDepth.toString()}
          status={metrics.queueDepth > 50 ? "warning" : "success"}
        />
        <Row
          icon={<Database className="h-4 w-4 text-primary" />}
          label="DB latency p95"
          value={`${metrics.dbLatencyMs} ms`}
          status={metrics.dbLatencyMs > 100 ? "warning" : "success"}
        />
      </ul>
      <p className="mt-4 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        Last incident:{" "}
        <span className="text-foreground">
          {metrics.lastIncidentAt ? formatRelative(metrics.lastIncidentAt) : "none on record"}
        </span>
      </p>
    </SectionCard>
  );
}

function Row({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "success" | "warning" | "destructive";
}) {
  const ringClass =
    status === "success"
      ? "bg-success/10 ring-success/20"
      : status === "warning"
        ? "bg-warning/10 ring-warning/20"
        : "bg-destructive/10 ring-destructive/20";
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ring-1 ${ringClass}`}>
          {icon}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="tabular text-sm font-semibold">{value}</span>
    </li>
  );
}
