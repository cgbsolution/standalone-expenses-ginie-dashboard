"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIME_RANGES, type TimeRange } from "@/lib/constants";
import { SectionCard } from "./section-card";

interface ChartCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  rangeValue?: TimeRange;
  onRangeChange?: (r: TimeRange) => void;
  showRange?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  rangeValue,
  onRangeChange,
  showRange,
  actions,
  children,
  className,
}: ChartCardProps) {
  return (
    <SectionCard
      title={title}
      description={description}
      className={className}
      action={
        showRange ? (
          <div className="flex items-center gap-2">
            {actions}
            <Tabs
              value={rangeValue}
              onValueChange={(v) => onRangeChange?.(v as TimeRange)}
            >
              <TabsList className="h-7 p-0.5">
                {TIME_RANGES.map((r) => (
                  <TabsTrigger key={r} value={r} className="h-6 px-2 text-[11px]">
                    {r}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        ) : (
          actions
        )
      }
      bodyClassName="pt-1"
    >
      {children}
    </SectionCard>
  );
}
