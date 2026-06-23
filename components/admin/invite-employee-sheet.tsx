"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";

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
import { useInviteUser } from "@/lib/hooks/use-users";
import { EmployeeCombobox } from "@/components/admin/employee-combobox";
import { cn } from "@/lib/utils";

const schema = z.object({
  displayName: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["employee", "admin"]),
  department: z.string().optional().default(""),
  employeeId: z.string().optional().default(""),
  managerEmail: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
});
type FormValues = z.infer<typeof schema>;

export function InviteEmployeeSheet({ tenantSlug }: { tenantSlug: string }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useInviteUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      email: "",
      role: "employee",
      department: "",
      employeeId: "",
      managerEmail: "",
    },
  });

  async function onSubmit(values: FormValues) {
    await mutateAsync({
      tenantSlug,
      email: values.email,
      displayName: values.displayName,
      role: values.role,
      department: values.department || null,
      employeeId: values.employeeId || null,
      managerEmail: values.managerEmail || null,
    });
    form.reset();
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Invite employee
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite employee</SheetTitle>
          <SheetDescription>
            Add a teammate to this tenant. They&apos;ll get sign-in instructions at the
            email you provide.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <Field label="Full name" htmlFor="displayName" error={form.formState.errors.displayName?.message}>
            <Input id="displayName" placeholder="Riya Mehta" {...form.register("displayName")} />
          </Field>

          <Field label="Work email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="riya@company.com"
              {...form.register("email")}
            />
          </Field>

          <Field label="Role" htmlFor="role">
            <select
              id="role"
              {...form.register("role")}
              className={cn(
                "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" htmlFor="department">
              <Input id="department" placeholder="Engineering" {...form.register("department")} />
            </Field>
            <Field label="Employee ID" htmlFor="employeeId">
              <Input id="employeeId" className="font-mono" placeholder="ACM-0143" {...form.register("employeeId")} />
            </Field>
          </div>

          <Field
            label="Manager"
            htmlFor="managerEmail"
            error={form.formState.errors.managerEmail?.message}
          >
            <EmployeeCombobox
              id="managerEmail"
              tenantSlug={tenantSlug}
              value={form.watch("managerEmail") ?? ""}
              onChange={(email) => form.setValue("managerEmail", email, { shouldValidate: true })}
              placeholder="Search for a manager…"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? "Inviting…" : "Send invite"}
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
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
