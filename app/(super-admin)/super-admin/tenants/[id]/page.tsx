"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users2, Wallet, Receipt, CalendarDays, MoreHorizontal, ShieldCheck, User as UserIcon, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlanBadge, TenantStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { InviteEmployeeSheet } from "@/components/admin/invite-employee-sheet";
import { useTenant } from "@/lib/hooks/use-tenants";
import { useUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/use-users";
import { formatDate } from "@/lib/format";
import type { User } from "@/types/auth";

interface PageProps {
  params: { id: string };
}

export default function TenantDetailPage({ params }: PageProps) {
  const { data: tenant, isLoading } = useTenant(params.id);
  const { data: users, isLoading: usersLoading } = useUsers({ tenant: tenant?.slug });

  return (
    <>
      <Link href="/super-admin/tenants" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> All tenants
      </Link>

      {isLoading ? (
        <Skeleton className="mb-6 h-24 w-full" />
      ) : tenant ? (
        <>
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-card-light dark:shadow-card-dark sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar name={tenant.name} size="lg" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{tenant.name}</h2>
                <p className="text-xs text-muted-foreground">/{tenant.slug} · {tenant.userCount} users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PlanBadge tier={tenant.plan} />
              <TenantStatusBadge status={tenant.status} />
              <Button size="sm" variant="outline">Impersonate</Button>
            </div>
          </div>

          <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icon={Users2} label="Users" node={<span>{tenant.userCount}</span>} />
            <Kpi icon={Wallet} label="MRR" node={<CurrencyDisplay value={tenant.mrr || 0} currency="INR" compact />} />
            <Kpi icon={Receipt} label="30-day volume" node={<CurrencyDisplay value={tenant.monthlyExpenseVolume || 0} currency="INR" compact />} />
            <Kpi icon={CalendarDays} label="Created" node={<span className="text-base">{formatDate(tenant.createdAt)}</span>} />
          </section>

          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Users</p>
                {tenant.adminEmail ? <p className="text-xs text-muted-foreground">Admin: {tenant.adminName || tenant.adminEmail}</p> : null}
              </div>
              <InviteEmployeeSheet tenantSlug={tenant.slug} />
            </div>
            {usersLoading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : !users?.length ? (
              <EmptyState icon={Users2} title="No users" description="This tenant has no employees yet." className="border-0" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">Grade</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={u.displayName} size="sm" />
                          <div>
                            <p className="font-medium">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><Badge variant="secondary" className="capitalize">{u.role}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.grade || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.department || "—"}</td>
                      <td className="px-4 py-2.5 text-right"><UserActions user={u} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <PageHeader title="Tenant not found" description={`No tenant with slug "${params.id}"`} />
      )}
    </>
  );
}

function UserActions({ user }: { user: User }) {
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const [confirm, setConfirm] = useState(false);
  if (user.role === "super_admin") return null;
  const isAdmin = user.role === "admin";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.displayName}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Manage user</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin ? (
            <DropdownMenuItem onSelect={() => update.mutate({ email: user.email, role: "employee" })}>
              <UserIcon className="h-4 w-4" /> Make employee
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => update.mutate({ email: user.email, role: "admin" })}>
              <ShieldCheck className="h-4 w-4" /> Make admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirm(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" /> Remove user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {user.displayName}?</DialogTitle>
            <DialogDescription>
              This removes {user.email} from the tenant. Their expense history stays, but they can no
              longer sign in. You can re-invite them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(user.email, {
                  onSuccess: () => { toast.success(`${user.displayName} removed`); setConfirm(false); },
                })
              }
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Kpi({ icon: Icon, label, node }: { icon: React.ComponentType<{ className?: string }>; label: string; node: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className="text-xl font-semibold">{node}</div>
    </div>
  );
}
