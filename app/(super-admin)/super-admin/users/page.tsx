"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Mail } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/lib/hooks/use-users";
import { formatRelative } from "@/lib/format";
import { toast } from "sonner";
import type { Role, User } from "@/types/auth";

const ROLE_BADGE: Record<Role, { variant: "default" | "success" | "muted" | "warning"; label: string }> = {
  super_admin: { variant: "warning", label: "Super Admin" },
  admin: { variant: "default", label: "Admin" },
  employee: { variant: "muted", label: "Employee" },
};

export default function UsersPage() {
  const { data: users, isLoading, error, refetch } = useUsers();

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        id: "user",
        accessorKey: "displayName",
        header: "User",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <UserAvatar name={u.displayName} src={u.avatarUrl ?? undefined} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "tenantSlug",
        header: "Tenant",
        cell: ({ row }) => {
          const slug = row.original.tenantSlug;
          if (!slug) return <span className="text-xs text-muted-foreground">Platform</span>;
          return (
            <Link
              href={`/super-admin/tenants/${slug}`}
              className="text-xs font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {slug}
            </Link>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const c = ROLE_BADGE[row.original.role];
          return <Badge variant={c.variant}>{c.label}</Badge>;
        },
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.department ?? "—"}</span>
        ),
      },
      {
        accessorKey: "employeeId",
        header: "Employee ID",
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.employeeId ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "managerEmail",
        header: "Manager",
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground">
            {row.original.managerEmail ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Email ${row.original.displayName}`}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:${row.original.email}`;
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Users"
        description="Every employee across every tenant. Read-only — manage in the tenant context."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("CSV export not wired yet")}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      <DataTable<User>
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        searchPlaceholder="Search by name, email, department…"
        emptyTitle="No users found"
        emptyDescription="Once tenants invite employees, they'll show up here."
      />
    </>
  );
}
