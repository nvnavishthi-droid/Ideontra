// LoadingRegion.tsx — Announce a loading surface once and hide decorative placeholders.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
// Expose a named busy region without making skeleton blocks interactive.
export function LoadingRegion({ label, variant, className, children }: {
  label: string;
  variant: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={label}
      data-skeleton={variant} className={cn("relative", className)}>
      <div aria-hidden="true" className="contents">{children}</div>
      <span className="sr-only">{label}…</span>
    </div>
  );
}
