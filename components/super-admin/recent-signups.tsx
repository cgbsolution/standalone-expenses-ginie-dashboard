"use client";

import Link from "next/link";
import { SectionCard } from "@/components/shared/section-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanBadge, TenantStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatRelative } from "@/lib/format";
import type { Tenant } from "@/types/tenant";

export function RecentSignups({ tenants }: { tenants: Tenant[] }) {
  return (
    <SectionCard
      title="Recent signups"
      description="Newest tenants on the platform"
      action={
        <Link
          href="/super-admin/tenants"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      }
      bodyClassName="px-0 pb-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar name={t.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.adminEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <PlanBadge tier={t.plan} />
              </TableCell>
              <TableCell>
                <TenantStatusBadge status={t.status} />
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatRelative(t.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
