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
import { PLATFORM_SLUG, type WorkspaceConfig } from "@/lib/api/settings";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const MONTHS = ["January", "April", "July", "October"];

export default function PlatformSettingsPage() {
  const { data, isLoading } = useConfig(PLATFORM_SLUG);
  const update = useUpdateConfig(PLATFORM_SLUG);
  const [form, setForm] = useState<WorkspaceConfig | null>(null);

  useEffect(() => { if (data) setForm(data.config); }, [data]);

  const set = <K extends keyof WorkspaceConfig>(k: K, v: WorkspaceConfig[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    try { await update.mutateAsync(form); toast.success("Platform defaults saved"); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  if (isLoading || !form) {
    return (<><PageHeader title="Platform settings" description="Defaults applied to new tenants" /><Skeleton className="h-96" /></>);
  }

  return (
    <>
      <PageHeader title="Platform settings" description="Defaults applied to newly created tenants" />
      <Card>
        <CardHeader>
          <CardTitle>New-tenant defaults</CardTitle>
          <CardDescription>Currency, fiscal calendar, and policy a tenant starts with. They can override these in their own workspace settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Default currency</Label>
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Fiscal year starts</Label>
              <select value={form.fiscalYearStart} onChange={(e) => set("fiscalYearStart", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <ToggleRow label="Require receipts by default" checked={form.receiptRequired} onChange={(v) => set("receiptRequired", v)} />
          <ToggleRow label="Email notifications by default" checked={form.notifyByEmail} onChange={(v) => set("notifyByEmail", v)} />
        </CardContent>
        <CardFooter className="justify-end border-t border-border/60 pt-4">
          <Button size="sm" onClick={save} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save defaults
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium">{label}</p>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-primary" : "bg-muted")}>
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-1")} />
      </button>
    </div>
  );
}
