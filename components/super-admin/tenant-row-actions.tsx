"use client";

import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pause, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/types/tenant";

export function TenantRowActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();

  return (
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
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Tenant actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(`/super-admin/tenants/${tenant.slug}`)}>
          <Eye className="h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast.info("Impersonation will open the tenant admin shell as this user")}>
          <UserCog className="h-4 w-4" /> Impersonate admin
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            toast.info(
              tenant.status === "suspended" ? "Reactivate flow not wired yet" : "Suspend flow not wired yet",
            )
          }
        >
          <Pause className="h-4 w-4" />
          {tenant.status === "suspended" ? "Reactivate" : "Suspend"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast.error("Delete is destructive and not wired yet — would PATCH status=churned")}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
