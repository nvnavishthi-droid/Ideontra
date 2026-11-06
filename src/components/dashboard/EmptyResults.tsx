// EmptyResults.tsx — Single empty message inside the results box.
import { Button } from "@/components/ui/button";
// Render one empty state inside the results boundary.
export function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-muted-foreground">No ideas match these filters.</p>
      <Button variant="outline" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
