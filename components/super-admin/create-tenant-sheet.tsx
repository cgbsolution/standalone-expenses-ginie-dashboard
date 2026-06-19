"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCreateTenant } from "@/lib/hooks/use-tenants";
import { slugify } from "@/lib/utils";
import type { PlanTier } from "@/types/tenant";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  adminName: z.string().min(2, "Admin name is too short"),
  adminEmail: z.string().email("Enter a valid email"),
  customSubdomain: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[a-z0-9.-]+$/.test(v),
      "Lowercase letters, digits, dots and dashes only",
    ),
  plan: z.enum(["starter", "growth", "scale", "enterprise"]),
});
type FormValues = z.infer<typeof schema>;

/** Normalise free-form input into a valid domain/subdomain: lowercase, keeping
 *  dots and dashes, with any other disallowed run (spaces, etc.) collapsed to a
 *  dash. Allows values like "cgbindia.com". */
function toSubdomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+/, "");
}

const PLANS: { value: PlanTier; label: string; price: string }[] = [
  { value: "starter", label: "Starter", price: "Free" },
  { value: "growth", label: "Growth", price: "$800/mo" },
  { value: "scale", label: "Scale", price: "$2,400/mo" },
  { value: "enterprise", label: "Enterprise", price: "$6,200/mo" },
];

export function CreateTenantSheet() {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCreateTenant();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      adminName: "",
      adminEmail: "",
      customSubdomain: "",
      plan: "growth",
    },
  });

  const selectedPlan = form.watch("plan");
  const watchedName = form.watch("name");
  const watchedSlug = form.watch("customSubdomain");
  const previewSlug = watchedSlug || slugify(watchedName);

  async function onSubmit(values: FormValues) {
    try {
      await mutateAsync({
        ...values,
        customSubdomain: values.customSubdomain || slugify(values.name),
      });
      form.reset();
      setOpen(false);
    } catch (err) {
      // Hook already surfaces a toast; nothing more to do here.
      if (err instanceof Error) toast.error(err.message);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New tenant
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create a tenant</SheetTitle>
          <SheetDescription>
            Provision a new workspace and invite its admin. The admin will receive
            sign-in instructions at the email you provide.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <Field label="Company name" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" placeholder="Acme Holdings" {...form.register("name")} />
          </Field>

          <Field
            label="Custom subdomain"
            htmlFor="customSubdomain"
            error={form.formState.errors.customSubdomain?.message}
            hint={previewSlug ? `Tenant URL: /t/${previewSlug}/admin` : "Will be derived from company name"}
          >
            <Input
              id="customSubdomain"
              placeholder="acme"
              {...form.register("customSubdomain")}
              onChange={(e) =>
                form.setValue("customSubdomain", toSubdomain(e.target.value), {
                  shouldValidate: true,
                })
              }
            />
          </Field>

          <Separator />

          <Field label="Admin name" htmlFor="adminName" error={form.formState.errors.adminName?.message}>
            <Input id="adminName" placeholder="Riya Mehta" {...form.register("adminName")} />
          </Field>

          <Field label="Admin email" htmlFor="adminEmail" error={form.formState.errors.adminEmail?.message}>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@acme.com"
              {...form.register("adminEmail")}
            />
          </Field>

          <Separator />

          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => {
                const selected = selectedPlan === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => form.setValue("plan", p.value, { shouldValidate: true })}
                    className={`rounded-lg border bg-background/40 p-3 text-left transition-all ${
                      selected
                        ? "border-primary/50 bg-primary/10 shadow-glow-sm"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{p.price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? "Creating…" : "Create tenant"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
