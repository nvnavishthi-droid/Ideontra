// global-error.tsx — Last-resort recovery when the root layout fails.
"use client";
// Render a self-contained document when no parent layout can render.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Unable to display the application</h1>
          <p>Please try loading the application again.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
