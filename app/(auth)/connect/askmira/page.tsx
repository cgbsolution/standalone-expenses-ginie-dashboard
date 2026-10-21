"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import {
  approveAskmira,
  getAskmiraConnection,
  type AskmiraConnection,
  type AskmiraConnectRequest,
} from "@/lib/api/askmira";
import { apiErrorMessage } from "@/lib/api/client";

function readRequest(): AskmiraConnectRequest | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  const request = {
    tenant_id: q.get("tenant_id") ?? "",
    tenant_name: q.get("tenant_name") ?? "",
    redirect_uri: q.get("redirect_uri") ?? "",
    state: q.get("state") ?? "",
    challenge: q.get("challenge") ?? "",
  };
  return Object.values(request).every(Boolean) ? request : null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * /connect/askmira — AskMira asks to connect one of its workspaces to the
 * signed-in admin's workspace here. Allow makes a one-time code, bound to this
 * workspace, that only the AskMira server which asked can use.
 */
export default function ConnectAskmiraPage() {
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.isHydrated);
  const [request, setRequest] = useState<AskmiraConnectRequest | null>(null);
  const [mine, setMine] = useState<AskmiraConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setRequest(readRequest()), []);
  const user = session?.user;
  const isAdmin = useMemo(() => user?.role === "admin" && Boolean(user.tenantSlug), [user]);

  useEffect(() => {
    if (!isAdmin) return;
    getAskmiraConnection()
      .then(setMine)
      .catch((e) => setError(apiErrorMessage(e, "Could not read your workspace")));
  }, [isAdmin]);

  const allow = async () => {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await approveAskmira(request));
    } catch (e) {
      setError(apiErrorMessage(e, "Could not allow the connection"));
      setBusy(false);
    }
  };

  const cancel = () => {
    if (request) window.location.assign(request.redirect_uri.replace(/\/callback$/, ""));
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-semibold">Connect AskMira</h1>
      </div>

      {!request ? (
        <p className="text-sm text-muted-foreground">
          This link is incomplete. Start again from AskMira: Settings → Connectors → ExpenseGenie → Connect.
        </p>
      ) : !hydrated ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : !isAdmin ? (
        <p className="text-sm text-muted-foreground">
          Only an admin of a workspace here can connect it to AskMira. Sign in with an admin account of your workspace,
          or ask one of them to press Connect in AskMira.
        </p>
      ) : (
        <>
          <p className="text-sm">
            The AskMira workspace <span className="font-semibold">“{request.tenant_name}”</span> at{" "}
            <span className="font-mono">{hostOf(request.redirect_uri)}</span> asks to connect to your workspace{" "}
            <span className="font-semibold">“{mine?.tenant ?? user?.tenantSlug}”</span>.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Its people can open ExpenseGenie from AskMira without a second password.</li>
            <li>It keeps your people here in step with AskMira (HR as admins, everyone else as employees).</li>
            <li>Its people can see their own claims, approvals and totals in AskMira, as their role here allows.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            It reaches your workspace only. You can disconnect it any time under Settings → AskMira connection.
          </p>
          {mine?.connected && mine.askmira_workspace !== request.tenant_name ? (
            <p className="text-sm text-amber-600">
              Your workspace is already connected to “{mine.askmira_workspace}”. Disconnect that first.
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-3">
            <Button onClick={() => void allow()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Allow
            </Button>
            <Button variant="outline" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Signed in as {user?.email}.</p>
        </>
      )}
    </div>
  );
}
