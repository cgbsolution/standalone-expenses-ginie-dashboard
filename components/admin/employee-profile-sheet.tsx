"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Pencil, ShieldCheck, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useUpdateUser } from "@/lib/hooks/use-users";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

const schema = z.object({
  displayName: z.string().min(2, "Name is too short"),
  role: z.enum(["admin", "employee"]),
  department: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  managerEmail: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  financeManagerEmail: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  employeeId: z.string().optional().default(""),
  companyCode: z.string().optional().default(""),
  vendorCode: z.string().optional().default(""),
  costCenter: z.string().optional().default(""),
  sectionCode: z.string().optional().default(""),
});
type FormValues = z.infer<typeof schema>;

interface EmployeeProfileSheetProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeProfileSheet({ user, open, onOpenChange }: EmployeeProfileSheetProps) {
  const [editing, setEditing] = useState(false);
  const currentEmail = useAuthStore((s) => s.session?.user.email ?? "");
  const { mutateAsync, isPending } = useUpdateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(user),
  });

  // Re-seed the form whenever the selected user changes, and reset to view mode
  // when the sheet is reopened on a new row.
  useEffect(() => {
    if (open && user) {
      form.reset(defaultsFor(user));
      setEditing(false);
    }
  }, [open, user, form]);

  if (!user) return null;

  const isSelf = user.email === currentEmail;

  async function onSubmit(values: FormValues) {
    if (!user) return;
    await mutateAsync({ email: user.email, ...values });
    setEditing(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="sr-only">{user.displayName}'s profile</SheetTitle>
          <SheetDescription className="sr-only">
            View and edit this team member's profile.
          </SheetDescription>
        </SheetHeader>

        <ProfileHero user={user} />

        {isSelf ? (
          <p className="-mt-2 mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
            This is you. Be careful — changing your role can lock you out of admin pages.
          </p>
        ) : null}

        <div className="mb-4 flex items-center justify-between gap-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Profile
          </h4>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                form.reset(defaultsFor(user));
                setEditing(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Display name" htmlFor="displayName" error={form.formState.errors.displayName?.message}>
            <Input
              id="displayName"
              {...form.register("displayName")}
              disabled={!editing}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField label="Email">
              <span className="font-mono text-[11px] text-foreground">{user.email}</span>
            </ReadOnlyField>
            <Field label="Role" htmlFor="role">
              <select
                id="role"
                {...form.register("role")}
                disabled={!editing || isSelf}
                className={cn(
                  "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  (!editing || isSelf) && "cursor-not-allowed opacity-70",
                )}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>

          <Separator />

          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Organization
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" htmlFor="department">
              <Input id="department" {...form.register("department")} disabled={!editing} />
            </Field>
            <Field label="Grade" htmlFor="grade">
              <Input id="grade" placeholder="G5" {...form.register("grade")} disabled={!editing} />
            </Field>
          </div>

          <Field label="Manager email" htmlFor="managerEmail" error={form.formState.errors.managerEmail?.message}>
            <Input
              id="managerEmail"
              type="email"
              placeholder="manager@company.com"
              {...form.register("managerEmail")}
              disabled={!editing}
            />
          </Field>

          <Field
            label="Finance manager email"
            htmlFor="financeManagerEmail"
            error={form.formState.errors.financeManagerEmail?.message}
          >
            <Input
              id="financeManagerEmail"
              type="email"
              placeholder="finance@company.com"
              {...form.register("financeManagerEmail")}
              disabled={!editing}
            />
          </Field>

          <Separator />

          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HR codes
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee ID" htmlFor="employeeId">
              <Input id="employeeId" className="font-mono" {...form.register("employeeId")} disabled={!editing} />
            </Field>
            <Field label="Company code" htmlFor="companyCode">
              <Input id="companyCode" className="font-mono" {...form.register("companyCode")} disabled={!editing} />
            </Field>
            <Field label="Vendor code" htmlFor="vendorCode">
              <Input id="vendorCode" className="font-mono" {...form.register("vendorCode")} disabled={!editing} />
            </Field>
            <Field label="Cost center" htmlFor="costCenter">
              <Input id="costCenter" className="font-mono" {...form.register("costCenter")} disabled={!editing} />
            </Field>
            <Field label="Section code" htmlFor="sectionCode">
              <Input id="sectionCode" className="font-mono" {...form.register("sectionCode")} disabled={!editing} />
            </Field>
          </div>

          {editing ? (
            <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-end gap-2 border-t border-border bg-card/95 px-6 py-3 backdrop-blur-xl">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.reset(defaultsFor(user));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!form.formState.isDirty || isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ProfileHero({ user }: { user: User }) {
  return (
    <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet-500/15 to-cyan-500/10" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative px-6 pb-6 pt-10 text-center">
        <UserAvatar
          name={user.displayName}
          src={user.avatarUrl ?? undefined}
          size="lg"
          className="mx-auto h-20 w-20 ring-4 ring-card"
        />
        <h3 className="mt-4 text-base font-semibold tracking-tight">{user.displayName}</h3>
        <a
          href={`mailto:${user.email}`}
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Mail className="h-3 w-3" />
          {user.email}
        </a>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant={user.role === "admin" ? "default" : "muted"}>
            {user.role === "admin" ? (
              <>
                <ShieldCheck className="h-3 w-3" />
                Admin
              </>
            ) : (
              "Employee"
            )}
          </Badge>
          {user.tenantSlug ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              · {user.tenantSlug}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex h-10 items-center rounded-lg border border-dashed border-border bg-muted/20 px-3 text-sm">
        {children}
      </div>
    </div>
  );
}

function defaultsFor(user: User | null): FormValues {
  return {
    displayName: user?.displayName ?? "",
    role: (user?.role === "admin" ? "admin" : "employee") as "admin" | "employee",
    department: user?.department ?? "",
    grade: user?.grade ?? "",
    managerEmail: user?.managerEmail ?? "",
    financeManagerEmail: (user as { financeManagerEmail?: string } | null)?.financeManagerEmail ?? "",
    employeeId: user?.employeeId ?? "",
    companyCode: user?.companyCode ?? "",
    vendorCode: user?.vendorCode ?? "",
    costCenter: user?.costCenter ?? "",
    sectionCode: user?.sectionCode ?? "",
  };
}

