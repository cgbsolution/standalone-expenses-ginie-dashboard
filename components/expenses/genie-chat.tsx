"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Paperclip, RefreshCw, Sparkles, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildChatUrl } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

/** If the chat hasn't loaded by then, the bot is probably asleep or unreachable. */
const SLOW_LOAD_MS = 20_000;

/**
 * Web version of the mobile app's Genie chat tab: the bot's own chat page in an
 * iframe. In a browser the page's paperclip button opens the normal file picker,
 * so receipts (image / PDF) upload as real chat messages with no extra wiring.
 */
export function GenieChat({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.session?.user);
  const queryClient = useQueryClient();
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  // Same identity the mobile app sends: the bot resolves the employee (and their
  // tenant, approver, grade) from this email.
  const email = user?.mail || user?.userPrincipalName || user?.email || "";
  const name =
    user?.displayName || [user?.givenName, user?.surname].filter(Boolean).join(" ").trim() || email;
  const chatUrl = useMemo(() => (email ? buildChatUrl(email, name) : null), [email, name]);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [reloadKey, chatUrl]);

  // The chat is cross-origin, so we can't hear when an expense is submitted.
  // Refresh the expense lists when the user leaves this page instead.
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries();
    };
  }, [queryClient]);

  if (!chatUrl) {
    return (
      <div className={cn("flex items-center justify-center rounded-xl border border-border p-10 text-sm text-muted-foreground", className)}>
        Sign in again to load the expense chat.
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]", className)}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-[#f0f2f5] shadow-card-light dark:shadow-card-dark">
        <iframe
          key={reloadKey}
          src={chatUrl}
          title="ExpenseGenie chat"
          className="h-[calc(100vh-15rem)] min-h-[520px] w-full border-0"
          allow="camera; clipboard-write"
          onLoad={() => {
            setLoaded(true);
            setSlow(false);
          }}
        />

        {!loaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 p-6 text-center">
            {slow ? (
              <>
                <p className="text-sm font-medium">The chat is taking longer than usual.</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  The Genie service may be waking up. Try again, or open it in a new tab.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={chatUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading Genie…</p>
              </>
            )}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">How to submit</h3>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">With a bill</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click the 📎 in the chat and choose the receipt (JPG, PNG or PDF). Genie reads it and
                  asks you to confirm the details.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Type className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Without a bill</p>
                <p className="mt-1 text-xs text-muted-foreground">Just type it, for example:</p>
                <p className="mt-2 rounded-md bg-muted/60 p-2 text-xs">
                  Submit taxi fare expense of Rs. 500 for 15 kms from Chinchpokli to Andheri for
                  business meeting 12/11/2026
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" />
            Restart chat
          </Button>
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <a href={chatUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              New tab
            </a>
          </Button>
        </div>
      </aside>
    </div>
  );
}
