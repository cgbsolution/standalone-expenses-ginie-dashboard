"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { loginWithAskmira } from "@/lib/api/auth";
import { homeRouteForRole } from "@/lib/nav";

/**
 * Landing page for "Open Expenses" in AskMira. AskMira puts a one-time,
 * one-minute sign-in token in the URL fragment — never sent to a server or in a
 * Referer — which is traded for a normal session here, then wiped from the URL.
 */
export default function AskmiraSsoPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setError("This link has no sign-in token. Open Expenses again from AskMira.");
      return;
    }
    loginWithAskmira(token)
      .then((session) => {
        setSession(session);
        router.replace(homeRouteForRole(session.user.role, session.user.tenantSlug));
      })
      .catch((err: Error) => setError(err.message));
  }, [router, setSession]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      {error ? (
        <>
          <h1 className="text-xl font-semibold">Couldn&apos;t sign you in from AskMira</h1>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/login">Sign in with a password instead</Link>
          </Button>
        </>
      ) : (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Signing you in from AskMira…
        </p>
      )}
    </div>
  );
}
