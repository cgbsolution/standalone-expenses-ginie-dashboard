"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users2, Wallet, Receipt, CalendarDays, MoreHorizontal, ShieldCheck, User as UserIcon, Trash2, Loader2, Banknote, PlugZap, ShieldOff, Check, X } from "lucide-react";
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTenant } from "@/lib/hooks/use-tenants";
import { useUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/use-users";
import { useConfig, useUpdateConfig } from "@/lib/hooks/use-settings";
import { useIntegrations } from "@/lib/hooks/use-integrations";
import { apiErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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

          <NoPolicyCard slug={tenant.slug} />
          <ManualPaymentCard slug={tenant.slug} />

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

/** Shared switch used by the super-admin tenant toggles. */
function Switch({
  checked,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

/**
 * Super-admin only. "No Policy" mode turns off the bot's spending caps, grade
 * matching, self-approval and blocking rules for this tenant — every bill goes
 * Manager → Finance on its full amount. Duplicate detection and bill
 * categorisation are deliberately unaffected.
 */
function NoPolicyCard({ slug }: { slug: string }) {
  const { data, isLoading } = useConfig(slug);
  const update = useUpdateConfig(slug);
  const enabled = !!data?.config.noPolicyMode;

  const toggle = async (next: boolean) => {
    try {
      await update.mutateAsync({ noPolicyMode: next });
      toast.success(next ? "No-Policy mode enabled" : "Policy enforcement restored");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldOff className="h-4 w-4" /> No-Policy mode
        </CardTitle>
        <CardDescription>
          For tenants that haven&apos;t configured an expense policy yet. Bills are accepted at
          their full amount and always routed Manager → Finance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <RuleList
            tone="off"
            title="Switched off"
            items={["Spending caps", "Grade matching", "Self-approval", "Blocking / deny rules"]}
          />
          <RuleList
            tone="on"
            title="Still enforced"
            items={["Duplicate bill detection", "Bill categorisation"]}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div>
            <p className="text-sm font-medium">Run this tenant without a policy</p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "No caps applied. Every bill needs Manager then Finance approval."
                : "This tenant's configured caps and rules are being enforced."}
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-11 rounded-full" />
          ) : (
            <Switch
              checked={enabled}
              label="Run this tenant without a policy"
              disabled={update.isPending}
              onChange={toggle}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "on" | "off";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs">
            {tone === "off" ? (
              <X className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <Check className="h-3 w-3 shrink-0 text-success" />
            )}
            <span className={tone === "off" ? "text-muted-foreground" : undefined}>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Super-admin only switch. Tenants wired to SAP get payment status from the
 * posting; tenants without it have no record of payment at all, so this lets
 * their finance approver tick it off by hand after final approval.
 * The backend re-checks the flag on every mark-paid call.
 */
function ManualPaymentCard({ slug }: { slug: string }) {
  const { data, isLoading } = useConfig(slug);
  const { data: integrations } = useIntegrations(slug);
  const update = useUpdateConfig(slug);

  const enabled = !!data?.config.manualPaymentEnabled;
  const sapConnected = !!integrations?.sap.enabled;

  const toggle = async (next: boolean) => {
    try {
      await update.mutateAsync({ manualPaymentEnabled: next });
      toast.success(next ? "Manual payment marking enabled" : "Manual payment marking disabled");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4" /> Manual payment marking
        </CardTitle>
        <CardDescription>
          Lets this tenant&apos;s finance approver record payment by hand once an expense is fully
          approved. Intended for tenants with no SAP connection to post payments through.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
            sapConnected
              ? "border-border bg-muted/40 text-muted-foreground"
              : "border-warning/30 bg-warning/10 text-warning",
          )}
        >
          <PlugZap className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            {sapConnected
              ? "SAP is connected for this tenant — payments normally post through SAP, so this is usually not needed."
              : "SAP is not connected for this tenant. Without this, approved expenses have no payment record."}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Allow finance to mark payments done</p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "Finance sees a “Mark payment done” action on approved expenses."
                : "Finance cannot record payments for this tenant."}
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-11 rounded-full" />
          ) : (
            <Switch
              checked={enabled}
              label="Allow finance to mark payments done"
              disabled={update.isPending}
              onChange={toggle}
            />
          )}
        </div>
      </CardContent>
    </Card>
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
