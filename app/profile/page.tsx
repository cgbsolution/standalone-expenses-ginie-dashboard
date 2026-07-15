"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Mail,
  Monitor,
  Moon,
  Plug,
  ShieldCheck,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateProfile, uploadAvatar } from "@/lib/api/users";
import { apiErrorMessage } from "@/lib/api/client";
import type { Role } from "@/types/auth";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Tenant Admin",
  employee: "Employee",
};

// Sign-in providers a user can connect on the Integrations row (mirrors mobile).
const PROVIDERS = [
  { value: "microsoft", label: "Microsoft" },
  { value: "google", label: "Google" },
  { value: "email", label: "Email" },
] as const;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePage() {
  const params = useSearchParams();
  const initialTab = params.get("tab") === "notifications" ? "notifications" : "general";
  const session = useAuthStore((s) => s.session);
  const setUser = useAuthStore((s) => s.setUser);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [providerBusy, setProviderBusy] = useState(false);

  if (!session) return null;
  const { user } = session;

  async function handleAvatarFile(file: File) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    setAvatarBusy(true);
    try {
      const updated = await uploadAvatar(user.email, file);
      setUser({ ...user, avatarUrl: updated.avatarUrl ?? undefined });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not upload your photo"));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleProviderChange(provider: string) {
    if (provider === (user.integrationProvider ?? "")) return;
    setProviderBusy(true);
    try {
      const updated = await updateProfile({ email: user.email, integrationProvider: provider });
      setUser({ ...user, integrationProvider: updated.integrationProvider ?? provider });
      toast.success("Sign-in provider updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update your provider"));
    } finally {
      setProviderBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal information, security, and workspace preferences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <IdentityCard
          name={user.displayName}
          email={user.email}
          role={user.role}
          tenantSlug={user.tenantSlug ?? null}
          department={user.department ?? null}
          employeeId={user.employeeId ?? null}
          avatarUrl={user.avatarUrl ?? null}
          integrationProvider={user.integrationProvider ?? null}
          avatarBusy={avatarBusy}
          providerBusy={providerBusy}
          onAvatarFile={handleAvatarFile}
          onProviderChange={handleProviderChange}
        />

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="h-9 w-full justify-start sm:w-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralForm
              defaultValues={{
                displayName: user.displayName,
                givenName: user.givenName ?? "",
                surname: user.surname ?? "",
                department: user.department ?? "",
                managerEmail: user.managerEmail ?? "",
              }}
              onSave={(values) => {
                setUser({
                  ...user,
                  displayName: values.displayName,
                  givenName: values.givenName,
                  surname: values.surname,
                  department: values.department || null,
                  managerEmail: values.managerEmail || null,
                });
                toast.success("Profile updated");
              }}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <SecurityPanel />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationsPanel />
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <PreferencesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

interface IdentityCardProps {
  name: string;
  email: string;
  role: Role;
  tenantSlug: string | null;
  department: string | null;
  employeeId: string | null;
  avatarUrl: string | null;
  integrationProvider: string | null;
  avatarBusy: boolean;
  providerBusy: boolean;
  onAvatarFile: (file: File) => void;
  onProviderChange: (provider: string) => void;
}

function IdentityCard({
  name,
  email,
  role,
  tenantSlug,
  department,
  employeeId,
  avatarUrl,
  integrationProvider,
  avatarBusy,
  providerBusy,
  onAvatarFile,
  onProviderChange,
}: IdentityCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <SectionCard className="overflow-hidden">
      <div className="relative -mx-6 -mt-5 h-24 bg-gradient-to-br from-primary/30 via-violet-500/20 to-cyan-500/10">
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>
      <div className="-mt-10 flex flex-col items-center text-center">
        <div className="relative">
          <UserAvatar name={name} src={avatarUrl ?? undefined} size="lg" className="h-20 w-20 ring-4 ring-card" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAvatarFile(file);
              e.target.value = ""; // allow re-selecting the same file
            }}
          />
          <button
            type="button"
            aria-label="Change avatar"
            disabled={avatarBusy}
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {avatarBusy ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <h3 className="mt-4 text-base font-semibold">{name}</h3>
        <p className="text-xs text-muted-foreground">{email}</p>
        <Badge variant="default" className="mt-3 border-primary/30 bg-primary/10 text-[10px] uppercase tracking-wider">
          {ROLE_LABELS[role]}
        </Badge>
      </div>

      <Separator className="my-5" />

      <dl className="space-y-3 text-xs">
        {tenantSlug ? (
          <Row icon={Building2} label="Workspace" value={tenantSlug} mono />
        ) : (
          <Row icon={Building2} label="Workspace" value="Platform-wide" />
        )}
        {department ? <Row icon={ShieldCheck} label="Department" value={department} /> : null}
        {employeeId ? <Row icon={CheckCircle2} label="Employee ID" value={employeeId} mono /> : null}
        <Row icon={Clock} label="Joined" value={formatRelative(Date.now() - 1000 * 60 * 60 * 24 * 124)} />
      </dl>

      <Separator className="my-5" />

      <div className="space-y-2">
        <Label htmlFor="integrationProvider" className="inline-flex items-center gap-2 text-muted-foreground">
          <Plug className="h-3.5 w-3.5" /> Sign-in provider
        </Label>
        <select
          id="integrationProvider"
          value={integrationProvider ?? ""}
          disabled={providerBusy}
          onChange={(e) => onProviderChange(e.target.value)}
          className="flex h-9 w-full rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <option value="" disabled>
            Select a provider…
          </option>
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </SectionCard>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: LucideIcon; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className={cn("truncate text-foreground", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

const generalSchema = z.object({
  displayName: z.string().min(1, "Required"),
  givenName: z.string().optional().default(""),
  surname: z.string().optional().default(""),
  department: z.string().optional().default(""),
  managerEmail: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
});
type GeneralValues = z.infer<typeof generalSchema>;

function GeneralForm({
  defaultValues,
  onSave,
}: {
  defaultValues: GeneralValues;
  onSave: (values: GeneralValues) => void;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema),
    defaultValues,
  });

  async function submit(values: GeneralValues) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onSave(values);
    form.reset(values);
    setSaving(false);
  }

  return (
    <SectionCard
      title="Personal information"
      description="Visible to your teammates and on submitted expenses"
    >
      <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
        <Field label="Display name" htmlFor="displayName" error={form.formState.errors.displayName?.message}>
          <Input id="displayName" {...form.register("displayName")} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="givenName">
            <Input id="givenName" {...form.register("givenName")} />
          </Field>
          <Field label="Last name" htmlFor="surname">
            <Input id="surname" {...form.register("surname")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Department" htmlFor="department">
            <Input id="department" placeholder="Engineering, Sales…" {...form.register("department")} />
          </Field>
          <Field
            label="Manager email"
            htmlFor="managerEmail"
            error={form.formState.errors.managerEmail?.message}
          >
            <Input
              id="managerEmail"
              type="email"
              placeholder="manager@company.com"
              {...form.register("managerEmail")}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.reset(defaultValues)}
            disabled={!form.formState.isDirty || saving}
          >
            Reset
          </Button>
          <Button type="submit" size="sm" disabled={!form.formState.isDirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

const securitySchema = z
  .object({
    current: z.string().min(1, "Required"),
    next: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(1, "Required"),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
type SecurityValues = z.infer<typeof securitySchema>;

function SecurityPanel() {
  const form = useForm<SecurityValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });
  const next = form.watch("next");
  const strength = passwordStrength(next);

  return (
    <SectionCard
      title="Password & security"
      description="Sign-in is local right now. SSO and 2FA arrive with the enterprise plan."
    >
      <form
        onSubmit={form.handleSubmit(async () => {
          await new Promise((r) => setTimeout(r, 400));
          toast.success("Password changed");
          form.reset({ current: "", next: "", confirm: "" });
        })}
        className="space-y-5"
      >
        <Field label="Current password" htmlFor="current" error={form.formState.errors.current?.message}>
          <Input id="current" type="password" autoComplete="current-password" {...form.register("current")} />
        </Field>

        <Field label="New password" htmlFor="next" error={form.formState.errors.next?.message}>
          <Input id="next" type="password" autoComplete="new-password" {...form.register("next")} />
          <PasswordStrengthBar strength={strength} />
        </Field>

        <Field label="Confirm new password" htmlFor="confirm" error={form.formState.errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="submit" size="sm">
            Update password
          </Button>
        </div>
      </form>

      <Separator className="my-6" />

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold">Active sessions</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            You're signed in from this browser. We'll list all sessions once the backend exposes them.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">This browser</p>
              <p className="text-[11px] text-muted-foreground">
                Started {formatRelative(Date.now() - 1000 * 60 * 23)}
              </p>
            </div>
          </div>
          <Badge variant="success" className="text-[10px]">
            Current
          </Badge>
        </div>
      </div>
    </SectionCard>
  );
}

const NOTIFICATION_PREFS = [
  {
    id: "expense_submitted",
    label: "Expense submitted",
    description: "When a team member submits an expense to you for approval",
    defaultOn: true,
  },
  {
    id: "expense_approved",
    label: "Expense approved",
    description: "When your own expense is approved",
    defaultOn: true,
  },
  {
    id: "expense_rejected",
    label: "Expense rejected",
    description: "When your own expense is rejected — includes the reason",
    defaultOn: true,
  },
  {
    id: "weekly_summary",
    label: "Weekly summary",
    description: "Every Monday at 9am, a digest of last week's activity",
    defaultOn: false,
  },
  {
    id: "platform_news",
    label: "Product updates",
    description: "Occasional emails about new ExpGenie features",
    defaultOn: false,
  },
] as const;

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    () => Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.defaultOn])),
  );

  return (
    <SectionCard
      title="Email notifications"
      description="Choose which events trigger an email to you"
    >
      <ul className="divide-y divide-border/60">
        {NOTIFICATION_PREFS.map((p) => {
          const on = prefs[p.id] ?? false;
          return (
            <li key={p.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <Toggle
                checked={on}
                onChange={(next) => {
                  setPrefs((prev) => ({ ...prev, [p.id]: next }));
                  toast.success(`${p.label}: ${next ? "on" : "off"}`);
                }}
                ariaLabel={p.label}
              />
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" />
        Delivery uses your account email. Add forwarding addresses on the enterprise plan.
      </div>
    </SectionCard>
  );
}

function PreferencesPanel() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = (theme ?? resolvedTheme ?? "system") as "light" | "dark" | "system";

  const options: { value: "light" | "dark" | "system"; label: string; icon: LucideIcon }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <SectionCard title="Appearance" description="Theme applies instantly across the dashboard">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Theme</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-lg border bg-background/40 p-4 text-xs font-medium transition-all",
                  selected
                    ? "border-primary/50 bg-primary/10 text-foreground shadow-glow-sm"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
                {selected ? (
                  <span className="absolute right-2 top-2 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Language" htmlFor="language">
          <select
            id="language"
            defaultValue="en-US"
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="fr-FR">Français</option>
            <option value="de-DE">Deutsch</option>
            <option value="hi-IN">हिन्दी</option>
          </select>
        </Field>
        <Field label="Time zone" htmlFor="tz">
          <select
            id="tz"
            defaultValue="Asia/Kolkata"
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET)</option>
          </select>
        </Field>
      </div>
    </SectionCard>
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

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        checked ? "border-primary/40 bg-gradient-to-r from-primary to-violet-500" : "border-border bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ["", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] ?? "" };
}

function PasswordStrengthBar({ strength }: { strength: { score: 0 | 1 | 2 | 3 | 4; label: string } }) {
  if (strength.score === 0) return null;
  const colors = ["", "bg-destructive", "bg-warning", "bg-cyan-500", "bg-success"];
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= strength.score ? colors[strength.score] : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="w-12 text-[10px] uppercase tracking-wider text-muted-foreground">
        {strength.label}
      </span>
    </div>
  );
}
