"use client";

import { useState } from "react";
import { Folder, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/use-categories";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { slug: string };
}

const SWATCHES = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

export default function CategoriesPage({ params }: PageProps) {
  const { slug } = params;
  const { data: categories, isLoading } = useCategories(slug);
  const create = useCreateCategory(slug);
  const update = useUpdateCategory(slug);
  const remove = useDeleteCategory(slug);

  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [budget, setBudget] = useState("");
  const [gl, setGl] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), color, monthlyBudget: Number(budget) || 0, glAccount: gl.trim() });
      setName(""); setBudget(""); setGl(""); setColor(SWATCHES[0]);
      toast.success("Category added");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Categories" description="Expense categories, monthly budgets, and GL mapping" />

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium">Add a category</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Travel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-budget">Monthly budget (₹)</Label>
            <Input id="c-budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-gl">GL account</Label>
            <Input id="c-gl" value={gl} onChange={(e) => setGl(e.target.value)} placeholder="400100" />
          </div>
          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-1.5">
              {SWATCHES.map((s) => (
                <button key={s} type="button" onClick={() => setColor(s)}
                  className={cn("h-6 w-6 rounded-full ring-offset-2 ring-offset-background", color === s && "ring-2 ring-foreground")}
                  style={{ backgroundColor: s }} aria-label={s} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={add} disabled={create.isPending || !name.trim()}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !categories?.length ? (
        <EmptyState icon={Folder} title="No categories yet" description="Add your first category above to start budgeting and GL mapping." />
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className={cn("flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4", !c.enabled && "opacity-60")}>
              <span className="h-8 w-8 shrink-0 rounded-lg" style={{ backgroundColor: c.color }} />
              <div className="min-w-40 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-medium">{c.name}</p>
                  {!c.enabled ? <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Disabled</span> : null}
                  {c.requiresBill ? <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">Bill required</span> : <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">No bill</span>}
                  {c.excludedFromAutoApprove ? <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Manual approval</span> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.glAccount ? <>GL {c.glAccount}</> : null}
                  {c.glProject ? <> · Proj {c.glProject}</> : null}
                  {c.glCrm ? <> · CRM {c.glCrm}</> : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`b-${c.id}`} className="text-xs text-muted-foreground">Budget ₹</Label>
                <Input
                  id={`b-${c.id}`}
                  className="h-8 w-28"
                  defaultValue={String(c.monthlyBudget)}
                  inputMode="numeric"
                  onBlur={(e) => {
                    const v = Number(e.target.value) || 0;
                    if (v !== c.monthlyBudget) update.mutate({ id: c.id, input: { monthlyBudget: v } });
                  }}
                />
              </div>
              <CurrencyDisplay value={c.monthlyBudget} currency="INR" compact className="hidden text-muted-foreground sm:inline" />
              <Button variant="ghost" size="icon-sm" aria-label="Delete"
                onClick={() => remove.mutate(c.id, { onSuccess: () => toast.success("Category removed") })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
