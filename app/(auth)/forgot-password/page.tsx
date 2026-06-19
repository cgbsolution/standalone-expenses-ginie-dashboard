"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/auth";
import { APP_NAME } from "@/lib/constants";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
    } catch {
      // Even on error we show the same confirmation — never reveal whether an
      // account exists. The backend logs the real failure.
      setSentTo(values.email);
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

      {sentTo ? (
        <div className="space-y-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
            we&apos;ve sent a link to reset your password. It expires in a couple of hours.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
            <p className="text-sm text-muted-foreground">
              Enter your work email and we&apos;ll send you a link to set a new one.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...form.register("email")}
                  className="pl-9"
                />
              </div>
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
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
