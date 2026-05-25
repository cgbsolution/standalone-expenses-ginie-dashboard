import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-96 bg-aurora-primary opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-50" />
      </div>
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You don't have access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role doesn't have permission to view this area. If you think this is a mistake,
          reach out to your platform owner.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Switch account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
