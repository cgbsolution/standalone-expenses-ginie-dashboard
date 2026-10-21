"use client";

import { useCallback, useEffect, useState } from "react";
import { Unplug } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { disconnectAskmira, getAskmiraConnection, type AskmiraConnection } from "@/lib/api/askmira";
import { apiErrorMessage } from "@/lib/api/client";

const when = (value: string | null) => (value ? new Date(value).toLocaleString() : "");

/**
 * Admin → Settings → AskMira connection: whether this workspace is connected
 * to an AskMira workspace, and a way to disconnect it. Connecting starts in
 * AskMira (Settings → Connectors) and is allowed on /connect/askmira here.
 */
export function AskmiraConnectionCard() {
  const [status, setStatus] = useState<AskmiraConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await getAskmiraConnection());
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not load the AskMira connection"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const disconnect = async () => {
    if (!window.confirm("Disconnect AskMira? Its people can't open ExpenseGenie from AskMira until it connects again.")) return;
    setBusy(true);
    try {
      setStatus(await disconnectAskmira());
      toast.success("AskMira disconnected");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not disconnect"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          AskMira connection
          {loading ? null : status?.connected ? <Badge>Connected</Badge> : <Badge variant="outline">Not connected</Badge>}
        </CardTitle>
        <CardDescription>
          AskMira, the HRMS, can sign your people in here without a second password, keep your people in step, and
          show their expenses in AskMira. The connection reaches this workspace only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10" />
        ) : status?.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              Connected to the AskMira workspace “{status.askmira_workspace}”
              {status.askmira_origin ? ` at ${status.askmira_origin}` : ""} since {when(status.connected_at)}.
            </p>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void disconnect()}>
              <Unplug className="h-4 w-4" /> Disconnect
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            To connect, an admin of your workspace in AskMira opens Settings → Connectors → ExpenseGenie → Connect, then
            an admin here signs in and presses Allow.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
