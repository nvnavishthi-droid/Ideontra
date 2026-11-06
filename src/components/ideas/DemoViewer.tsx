// DemoViewer.tsx — Authorized private playback or a supported external video link.
"use client";
import { useQuery } from "@tanstack/react-query";
import { readDemo } from "@/lib/api/workflows";
import { Button } from "@/components/ui/button";
import { VideoSkeleton } from "@/components/shared/ContentSkeletons";
import type { Idea } from "@/types/idea";
// Sign private URLs on demand; never expose Storage objects as public files.
export function DemoViewer({
  idea,
  onClose,
}: {
  idea: Idea;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["live", "demo", idea.id, idea.demoPath],
    queryFn: () => readDemo(idea.demoPath!),
    enabled: !!idea.demoPath,
    staleTime: 60000,
    gcTime: 60000,
  });
  return (
    <div className="flex flex-col gap-4">
      {idea.demoPath ? (
        query.isPending ? (
          <VideoSkeleton />
        ) : query.error ? (
          <p role="alert">{query.error.message}</p>
        ) : (
          <video
            controls
            playsInline
            className="aspect-video w-full rounded-md bg-muted object-contain"
            src={query.data}
          >
            <a href={query.data}>Open video</a>
          </video>
        )
      ) : idea.demoUrl ? (
        <a
          className="text-link underline"
          href={idea.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open outcome video
        </a>
      ) : (
        <p>No demo is attached.</p>
      )}
      <p>{idea.outcome}</p>
      <Button variant="outline" onClick={onClose}>
        Close viewer
      </Button>
    </div>
  );
}
