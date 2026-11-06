// OwnerSelect.tsx — Paginated live owner options for filters and assignments.
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { readOwners } from "@/lib/api/ideas";
import { Select } from "@/components/shared/Select";
import { Button } from "@/components/ui/button";
import { OwnerSkeleton } from "@/components/shared/ContentSkeletons";
// Read directory pages on demand without exposing anonymous ownership identities.
export function OwnerSelect({
  value,
  onChange,
  assign = false,
  invalid = false,
  id = "owner",
}: {
  value: string;
  onChange: (v: string) => void;
  assign?: boolean;
  invalid?: boolean;
  id?: string;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    enabled: typeof window !== "undefined",
    queryKey: ["live", "owners", assign, page],
    queryFn: () => readOwners(page, assign),
  });
  const rows = query.data?.rows ?? [];
  if (query.isPending) return <OwnerSkeleton />;
  return (
    <div className="flex flex-col gap-2">
      <Select
        id={id}
        filterStyle={!assign}
        className={assign ? undefined : "text-sm font-medium"}
        aria-label={assign ? undefined : "Filter by owner"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        options={[
          ...(!assign ? [{ value: "Unassigned", label: "Unassigned" }] : []),
          ...rows.map((r) => ({
            value: r.id,
            label: r.full_name ?? "Employee",
          })),
        ]}
        placeholder={assign ? "Select a team member" : "All owners"}
      />

      {query.error && (
        <p role="alert" className="text-xs text-destructive">
          {query.error.message}
        </p>
      )}
      {(page > 1 || (query.data?.total ?? 0) > page * 100) && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous owners
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={(query.data?.total ?? 0) <= page * 100}
            onClick={() => setPage(page + 1)}
          >
            More owners
          </Button>
        </div>
      )}
    </div>
  );
}
