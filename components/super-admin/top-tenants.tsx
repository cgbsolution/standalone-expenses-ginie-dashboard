"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PlanBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Tenant } from "@/types/tenant";

export function TopTenants({ tenants }: { tenants: Tenant[] }) {
  const max = Math.max(...tenants.map((t) => t.monthlyExpenseVolume), 1);
  return (
    <SectionCard
      title="Top tenants by usage"
      description="Monthly expense volume — last 30 days"
    >
      <ul className="space-y-4">
        {tenants.map((t, i) => {
          const pct = Math.max(8, Math.round((t.monthlyExpenseVolume / max) * 100));
          return (
            <li key={t.id} className="group">
              <div className="flex items-center gap-3">
                <span className="tabular w-5 text-xs font-mono text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <UserAvatar name={t.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/super-admin/tenants/${t.id}`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {t.name}
                    </Link>
                    <span className="flex items-center gap-2">
                      <CurrencyDisplay value={t.monthlyExpenseVolume} compact className="text-xs" />
                      <PlanBadge tier={t.plan} />
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-[width] duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
