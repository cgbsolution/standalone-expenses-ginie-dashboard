"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmployeeProfileSheet } from "@/components/admin/employee-profile-sheet";
import { EmployeeSpendSheet } from "@/components/admin/employee-spend-sheet";
import { InviteEmployeeSheet } from "@/components/admin/invite-employee-sheet";
import { BulkImportSheet } from "@/components/admin/bulk-import-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/lib/hooks/use-users";
import type { User } from "@/types/auth";

interface PageProps {
  params: { slug: string };
}

export default function TeamPage({ params }: PageProps) {
  const { slug } = params;
  const { data: users, isLoading, error, refetch } = useUsers({ tenant: slug });
  const [selected, setSelected] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [spendFor, setSpendFor] = useState<User | null>(null);
  const [spendOpen, setSpendOpen] = useState(false);

  // Keep the sheet in sync with the latest user data, so optimistic updates from
  // useUpdateUser show in the open sheet immediately.
  const selectedLive = selected
    ? users?.find((u) => u.email === selected.email) ?? selected
    : null;

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        id: "user",
        accessorKey: "displayName",
        header: "Employee",
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
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={row.original.role === "admin" ? "default" : "muted"}>
            {row.original.role === "admin" ? "Admin" : "Employee"}
          </Badge>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => <span className="text-xs">{row.original.department ?? "—"}</span>,
      },
      {
        accessorKey: "grade",
        header: "Grade",
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.grade ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "managerEmail",
        header: "Manager",
        cell: ({ row }) => {
          const manager = row.original.managerEmail;
          // A person can't be their own manager — hide self-references
          // (bad seed data, e.g. board office accounts) instead of showing them.
          const isSelf =
            !!manager && manager.toLowerCase() === row.original.email.toLowerCase();
          return (
            <span className="text-[11px] text-muted-foreground">
              {manager && !isSelf ? manager : "—"}
            </span>
          );
        },
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
        id: "open",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`View ${row.original.displayName}'s spend`}
              title="View spend"
              // The row itself opens the profile sheet — keep the click here.
              onClick={(ev) => {
                ev.stopPropagation();
                setSpendFor(row.original);
                setSpendOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Team"
        description="Manage your tenant's employees — invite, set roles, configure approval limits"
        actions={
          <div className="flex items-center gap-2">
            <BulkImportSheet tenantSlug={slug} />
            <InviteEmployeeSheet tenantSlug={slug} />
          </div>
        }
      />

      <DataTable<User>
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        onRowClick={(u) => {
          setSelected(u);
          setSheetOpen(true);
        }}
        searchPlaceholder="Search by name, email, department…"
        emptyTitle="No employees yet"
        emptyDescription="Invite your team to start submitting expenses."
      />

      <EmployeeProfileSheet user={selectedLive} open={sheetOpen} onOpenChange={setSheetOpen} />
      <EmployeeSpendSheet user={spendFor} open={spendOpen} onOpenChange={setSpendOpen} />
    </>
  );
}
