"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfig, useUpdateConfig } from "@/lib/hooks/use-settings";
import type { WorkspaceConfig } from "@/lib/api/settings";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { slug: string };
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const MONTHS = ["January", "April", "July", "October"];
const WEEKDAYS = ["Monday", "Sunday"];

export default function TenantSettingsPage({ params }: PageProps) {
  const { slug } = params;
  const { data, isLoading } = useConfig(slug);
  const update = useUpdateConfig(slug);
  const [form, setForm] = useState<WorkspaceConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data.config);
  }, [data]);

  const set = <K extends keyof WorkspaceConfig>(k: K, v: WorkspaceConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    try {
      await update.mutateAsync(form);
      toast.success("Workspace settings saved");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  if (isLoading || !form) {
    return (
      <>
        <PageHeader title="Workspace settings" description="Tenant-level configuration" />
        <Skeleton className="h-[520px]" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Workspace settings" description="Currency, fiscal calendar, and expense policy for this tenant" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Regional</CardTitle>
            <CardDescription>Currency and fiscal calendar used across reports and exports.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Currency" value={form.currency} onChange={(v) => set("currency", v)} options={CURRENCIES} />
            <SelectField label="Fiscal year starts" value={form.fiscalYearStart} onChange={(v) => set("fiscalYearStart", v)} options={MONTHS} />
            <SelectField label="Week starts" value={form.weekStart} onChange={(v) => set("weekStart", v)} options={WEEKDAYS} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense policy</CardTitle>
            <CardDescription>Defaults applied when employees submit expenses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="limit">Per-claim limit (₹, 0 = none)</Label>
                <Input id="limit" inputMode="numeric" value={String(form.perClaimLimit)}
                  onChange={(e) => set("perClaimLimit", Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auto">Auto-approve under (₹, 0 = off)</Label>
                <Input id="auto" inputMode="numeric" value={String(form.autoApproveUnder)}
                  onChange={(e) => set("autoApproveUnder", Number(e.target.value) || 0)} />
              </div>
            </div>
            <ToggleRow label="Receipt required" description="Employees must attach a receipt to submit."
              checked={form.receiptRequired} onChange={(v) => set("receiptRequired", v)} />
            <ToggleRow label="Email notifications" description="Send approval/rejection emails by default."
              checked={form.notifyByEmail} onChange={(v) => set("notifyByEmail", v)} />
          </CardContent>
          <CardFooter className="justify-end border-t border-border/60 pt-4">
            <Button size="sm" onClick={save} disabled={update.isPending}>
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-primary" : "bg-muted")}>
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-1")} />
      </button>
    </div>
  );
}
