"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword, validateResetToken } from "@/lib/api/auth";
import { APP_NAME } from "@/lib/constants";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [email, setEmail] = useState<string | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    let active = true;
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateResetToken(token).then((res) => {
      if (!active) return;
      setStatus(res.valid ? "valid" : "invalid");
      setEmail(res.email);
    });
    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(values: FormValues) {
    try {
      await resetPassword(token, values.password);
      toast.success("Password set — please sign in");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset your password");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 inline-flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-glow-sm">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </div>

      {status === "checking" ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your link…
        </div>
      ) : status === "invalid" ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Link expired or invalid</h1>
          <p className="text-sm text-muted-foreground">
            This password link is no longer valid. Request a fresh one and we&apos;ll email it to you.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
            <p className="text-sm text-muted-foreground">
              {email ? (
                <>
                  Choose a password for <span className="font-medium text-foreground">{email}</span>.
                </>
              ) : (
                "Choose a new password to finish signing in."
              )}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...form.register("password")}
                  className="pl-9"
                />
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...form.register("confirm")}
                  className="pl-9"
                />
              </div>
              {form.formState.errors.confirm ? (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? "Saving…" : "Set password & continue"}
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
