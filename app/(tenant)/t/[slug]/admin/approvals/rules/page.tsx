"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Workflow, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from "@/lib/hooks/use-rules";
import type { RuleAction, ApprovalRule } from "@/lib/api/rules";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { slug: string };
}

const ACTIONS: { value: RuleAction; label: string }[] = [
  { value: "auto_approve", label: "Auto-approve" },
  { value: "auto_reject", label: "Auto-reject" },
  { value: "route", label: "Route to approver" },
  { value: "escalate", label: "Escalate" },
];
const actionLabel = (a: RuleAction) => ACTIONS.find((x) => x.value === a)?.label ?? a;

function summary(r: ApprovalRule): string {
  const c = r.conditions || {};
  const parts: string[] = [];
  if (c.amountOver) parts.push(`amount > ₹${c.amountOver}`);
  if (c.category) parts.push(`category = ${c.category}`);
  if (c.grade) parts.push(`grade = ${c.grade}`);
  return parts.length ? parts.join(" AND ") : "any expense";
}

export default function ApprovalRulesPage({ params }: PageProps) {
  const { slug } = params;
  const { data: rules, isLoading } = useRules(slug);
  const create = useCreateRule(slug);
  const update = useUpdateRule(slug);
  const remove = useDeleteRule(slug);

  const [name, setName] = useState("");
  const [amountOver, setAmountOver] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  const [action, setAction] = useState<RuleAction>("route");

  const add = async () => {
    if (!name.trim()) return;
    const conditions: ApprovalRule["conditions"] = {};
    if (Number(amountOver) > 0) conditions.amountOver = Number(amountOver);
    if (category.trim()) conditions.category = category.trim();
    if (grade.trim()) conditions.grade = grade.trim();
    try {
      await create.mutateAsync({ name: name.trim(), action, conditions, priority: (rules?.length ?? 0) + 1 });
      setName(""); setAmountOver(""); setCategory(""); setGrade(""); setAction("route");
      toast.success("Rule created");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <>
      <Link href={`/t/${slug}/admin/approvals`} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Approvals
      </Link>
      <PageHeader title="Approval rules" description="Route or auto-decide expenses by amount, category, and grade" />

      <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Rules are saved and evaluated top-to-bottom by priority. Live enforcement in the approval workflow activates once the rules engine is switched on.
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium">New rule</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="r-name">Name</Label><Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="High-value travel" /></div>
          <div className="space-y-1.5"><Label htmlFor="r-amt">Amount over (₹)</Label><Input id="r-amt" inputMode="numeric" value={amountOver} onChange={(e) => setAmountOver(e.target.value)} placeholder="10000" /></div>
          <div className="space-y-1.5"><Label htmlFor="r-cat">Category</Label><Input id="r-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Travel" /></div>
          <div className="space-y-1.5"><Label htmlFor="r-grade">Grade</Label><Input id="r-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="G5" /></div>
          <div className="space-y-1.5">
            <Label>Action</Label>
            <select value={action} onChange={(e) => setAction(e.target.value as RuleAction)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button size="sm" onClick={add} disabled={create.isPending || !name.trim()}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add rule
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !rules?.length ? (
        <EmptyState icon={Workflow} title="No rules yet" description="Add a rule above to start automating approvals." />
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Badge variant="secondary" className="shrink-0">#{r.priority}</Badge>
              <div className="min-w-40 flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">When {summary(r)} → <span className="font-medium text-foreground">{actionLabel(r.action)}</span></p>
              </div>
              <button type="button" role="switch" aria-checked={r.enabled} aria-label="Enable rule"
                onClick={() => update.mutate({ id: r.id, input: { enabled: !r.enabled } })}
                className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", r.enabled ? "bg-primary" : "bg-muted")}>
                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", r.enabled ? "translate-x-5" : "translate-x-1")} />
              </button>
              <Button variant="ghost" size="icon-sm" aria-label="Delete"
                onClick={() => remove.mutate(r.id, { onSuccess: () => toast.success("Rule removed") })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
