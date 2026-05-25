import { type LucideIcon, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  bullets?: string[];
}

export function ComingSoon({
  icon: Icon = Construction,
  title,
  description = "We're building this out next. The route exists so navigation works — the content lands soon.",
  bullets,
}: ComingSoonProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-10 text-center shadow-card-light dark:shadow-card-dark">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-aurora-primary opacity-50" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 ring-1 ring-primary/30">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <Badge variant="default" className="mt-4 border-primary/30 bg-primary/10 text-[10px] uppercase tracking-wider">
          Coming soon
        </Badge>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {bullets && bullets.length > 0 ? (
          <ul className="mt-6 space-y-2 text-left text-xs text-muted-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
