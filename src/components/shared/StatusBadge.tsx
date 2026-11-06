// StatusBadge.tsx — Shared status label tones from the design system.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Status } from "@/types/idea";
// Display status with its label so color is never the only signal.
export function StatusBadge({ status }: { status: Status | "Overdue" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-border bg-muted px-2 py-1 text-xs font-medium whitespace-nowrap",
        ["Approved", "Done"].includes(status) && "text-primary",
        ["Under Evaluation", "In Progress"].includes(status) &&
          "bg-background text-link",
        status === "Rejected" && "bg-destructive/10 text-destructive",
        ["Draft", "Withdrawn"].includes(status) && "text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}
