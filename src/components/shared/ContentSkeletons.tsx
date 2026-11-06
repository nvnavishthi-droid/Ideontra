// ContentSkeletons.tsx — Shared initial-loading shapes for forms, detail and media.
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "./LoadingRegion";
// Keep idea metadata, tabs and content sections stable while detail data loads.
export function DetailSkeleton() {
  return (
    <LoadingRegion label="Loading idea" variant="detail" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2, 3].map((tab) => <Skeleton key={tab} className="h-10 w-24" />)}
      </div>
      <Skeleton className="h-3 w-40" />
      {Array.from({ length: 6 }, (_, section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className={section < 4 ? "h-4 w-5/6" : "h-4 w-24"} />
        </div>
      ))}
      <div className="flex flex-wrap gap-3 border-t pt-4">
        <Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" />
      </div>
    </LoadingRegion>
  );
}
// Reserve a responsive video area while its private playback URL is authorized.
export function VideoSkeleton() {
  return (
    <LoadingRegion label="Loading video" variant="video">
      <Skeleton className="aspect-video w-full" />
    </LoadingRegion>
  );
}
// Match one select control without adding another row below the field.
export function OwnerSkeleton() {
  return (
    <LoadingRegion label="Loading owners" variant="owners" className="h-10 w-full min-w-32">
      <Skeleton className="h-10 w-full border border-input" />
    </LoadingRegion>
  );
}
// Match the authentication card before request-bound identity checks finish.
export function AuthSkeleton() {
  return (
    <LoadingRegion label="Loading sign-in" variant="auth"
      className="flex min-h-dvh items-center justify-center p-5">
      <div className="panel flex w-full max-w-md flex-col gap-4 p-6 sm:p-8">
        <Skeleton className="h-6 w-28" /><Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" />
        </div>
        {[0, 1].map((field) => (
          <div key={field} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-20" />
      </div>
    </LoadingRegion>
  );
}
