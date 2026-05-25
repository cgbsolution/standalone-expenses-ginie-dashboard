import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-aurora-primary" />
        <div className="absolute inset-0 grid-pattern opacity-40 dark:opacity-100" />
      </div>
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">{children}</div>
      <div className="relative hidden overflow-hidden border-l border-border/40 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet-500/15 to-cyan-500/10" />
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <div className="max-w-md">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              ExpGenie Control Plane
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              One workspace for every expense your company touches.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Approve in seconds. Reimburse in days. Reconcile in hours instead of weeks. Built for
              teams that have outgrown spreadsheets but aren't ready for SAP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
