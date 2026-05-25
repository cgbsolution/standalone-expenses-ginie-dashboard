"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment, useMemo } from "react";

const LABEL_OVERRIDES: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  t: "Tenants",
  "audit-logs": "Audit logs",
};

function prettify(segment: string): string {
  return LABEL_OVERRIDES[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, idx) => ({
      label: prettify(part),
      href: "/" + parts.slice(0, idx + 1).join("/"),
      isLast: idx === parts.length - 1,
    }));
  }, [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c) => (
        <Fragment key={c.href}>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          {c.isLast ? (
            <span className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {c.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
