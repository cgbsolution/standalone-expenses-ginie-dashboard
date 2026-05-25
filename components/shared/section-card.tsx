import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  description,
  action,
  footer,
  bodyClassName,
  noPadding,
  className,
  children,
  ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-xl shadow-card-light dark:shadow-card-dark",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            {title ? <h3 className="text-sm font-semibold tracking-tight">{title}</h3> : null}
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={cn(noPadding ? "" : "px-6 pb-5", bodyClassName)}>{children}</div>
      {footer ? (
        <div className="border-t border-border/60 bg-muted/20 px-6 py-3 text-xs">{footer}</div>
      ) : null}
    </div>
  );
}
