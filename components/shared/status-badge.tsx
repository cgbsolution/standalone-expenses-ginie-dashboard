import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, FileEdit, XCircle, type LucideIcon } from "lucide-react";
import type { ApprovalStatus } from "@/types/expense";
import type { TenantStatus } from "@/types/tenant";

const expenseConfig: Record<
  ApprovalStatus,
  { variant: "default" | "success" | "destructive" | "warning" | "muted"; icon: LucideIcon }
> = {
  Pending: { variant: "warning", icon: Clock },
  Approved: { variant: "success", icon: CheckCircle2 },
  Rejected: { variant: "destructive", icon: XCircle },
  Draft: { variant: "muted", icon: FileEdit },
};

const tenantConfig: Record<
  TenantStatus,
  { variant: "default" | "success" | "destructive" | "warning" | "muted"; label: string }
> = {
  active: { variant: "success", label: "Active" },
  trialing: { variant: "default", label: "Trialing" },
  suspended: { variant: "destructive", label: "Suspended" },
  churned: { variant: "muted", label: "Churned" },
};

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const { variant, icon: Icon } = expenseConfig[status];
  return (
    <Badge variant={variant} className="gap-1.5 py-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const { variant, label } = tenantConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PlanBadge({
  tier,
}: {
  tier: "starter" | "growth" | "scale" | "enterprise" | null | undefined;
}) {
  if (!tier) {
    return (
      <span className="inline-flex items-center rounded-md border border-dashed border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Unassigned
      </span>
    );
  }
  const map = {
    starter: { className: "border-muted-foreground/20 bg-muted/40 text-muted-foreground", label: "Starter" },
    growth: { className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500", label: "Growth" },
    scale: { className: "border-primary/30 bg-primary/10 text-primary", label: "Scale" },
    enterprise: {
      className: "border-violet-500/40 bg-gradient-to-br from-violet-500/20 to-primary/20 text-violet-400",
      label: "Enterprise",
    },
  } as const;
  const { className, label } = map[tier];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
