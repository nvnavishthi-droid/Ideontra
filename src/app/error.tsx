// error.tsx — Recoverable route-level rendering error screen.
"use client";
import { Button } from "@/components/ui/button";
// Offer a retry without exposing internal exception details.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        The dashboard could not be displayed. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
