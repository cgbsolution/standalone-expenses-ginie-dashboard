"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pause, Play, Trash2, UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateTenant } from "@/lib/hooks/use-tenants";
import type { Tenant } from "@/types/tenant";

export function TenantRowActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const update = useUpdateTenant();
  const [confirmChurn, setConfirmChurn] = useState(false);

  const suspended = tenant.status === "suspended";
  const churned = tenant.status === "churned";

  const setStatus = (status: Tenant["status"], label: string) =>
    update.mutate(
      { slug: tenant.slug, input: { status } },
      { onSuccess: () => toast.success(`${tenant.name} ${label}`) },
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${tenant.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>Tenant actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push(`/super-admin/tenants/${tenant.slug}`)}>
            <Eye className="h-4 w-4" /> View details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(`/t/${tenant.slug}/admin`)}>
            <UserCog className="h-4 w-4" /> Open admin workspace
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {churned ? (
            <DropdownMenuItem onSelect={() => setStatus("active", "reactivated")}>
              <Play className="h-4 w-4" /> Reactivate
            </DropdownMenuItem>
          ) : suspended ? (
            <DropdownMenuItem onSelect={() => setStatus("active", "reactivated")}>
              <Play className="h-4 w-4" /> Reactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setStatus("suspended", "suspended")}>
              <Pause className="h-4 w-4" /> Suspend
            </DropdownMenuItem>
          )}

          {!churned ? (
            <DropdownMenuItem
              onSelect={() => setConfirmChurn(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmChurn} onOpenChange={setConfirmChurn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {tenant.name}?</DialogTitle>
            <DialogDescription>
              This marks the tenant as <strong>churned</strong> — it stops billing and hides it from
              active views, but keeps all data so you can reactivate later. It does not erase anything.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmChurn(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  { slug: tenant.slug, input: { status: "churned" } },
                  {
                    onSuccess: () => {
                      toast.success(`${tenant.name} marked as churned`);
                      setConfirmChurn(false);
                    },
                  },
                )
              }
            >
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
