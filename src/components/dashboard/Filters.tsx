// Filters.tsx — Aligned URL-backed search, filters and view controls.
"use client";
import { OwnerSelect } from "@/components/ideas/OwnerSelect";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  categories,
  statuses,
  quadrants,
  type DashboardFilters,
} from "@/types/idea";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
interface FilterMenuProps {
  title: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}
// Render one compact filter menu without filtering loaded client arrays.
function FilterMenu({ title, value, options, onChange }: FilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-full">
          <Icon name="chevron-down" />
          <span className="max-w-40 truncate">{value || title}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="">
            All {title.toLowerCase()}
          </DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
// Submit qualifying searches and filters to the server through URL parameters.
export function Filters({
  filters,
  total,
}: {
  filters: DashboardFilters;
  total: number;
}) {
  const [query, setQuery] = useState(filters.q);
  const [hint, setHint] = useState("");
  const { navigate, pending } = useDashboardNavigation();
  // Enforce the three-character search threshold on explicit submit.
  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      setHint("Type at least 3 characters to search.");
      return;
    }
    setHint("");
    navigate({ q: trimmed });
  }
  return (
    <div className="flex flex-col gap-3" aria-busy={pending}>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-end">
        <form onSubmit={search} className="min-w-0 flex-1">
          <label
            htmlFor="idea-search"
            className="mb-2 block text-xs font-medium"
          >
            Search ideas
          </label>
          <div className="relative">
            <Input
              id="idea-search"
              value={query}
              maxLength={100}
              placeholder="Search title and text · 3+ characters"
              onChange={(event) => {
                setQuery(event.target.value);
                if (!event.target.value) {
                  setHint("");
                  navigate({ q: "" });
                }
              }}
              className="h-10 pr-10"
            />
            <button
              type="submit"
              aria-label="Search ideas"
              className="absolute top-0 right-0 flex size-10 items-center justify-center text-muted-foreground"
            >
              <Icon name="search" />
            </button>
          </div>
          {hint && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {hint}
            </p>
          )}
        </form>
        <div className="flex flex-wrap gap-3">
          <FilterMenu
            title="Status"
            value={filters.status}
            options={statuses}
            onChange={(value) => navigate({ status: value })}
          />
          <FilterMenu
            title="Category"
            value={filters.category}
            options={categories}
            onChange={(value) => navigate({ category: value })}
          />
          <div className="min-w-32">
            <OwnerSelect
              id="owner-filter"
              value={filters.owner}
              onChange={(owner) => navigate({ owner })}
            />
          </div>
          <FilterMenu
            title="Quadrant"
            value={filters.quadrant}
            options={quadrants}
            onChange={(value) => navigate({ quadrant: value })}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {total} ideas {pending && "· Updating…"}
        </span>
        <div className="flex gap-3">
          {filters.view === "all" && (
            <>
              <Button
                variant={filters.layout === "board" ? "default" : "outline"}
                onClick={() => navigate({ layout: "board" })}
              >
                <Icon name="board" />
                Board
              </Button>
              <Button
                variant={filters.layout === "list" ? "default" : "outline"}
                onClick={() => navigate({ layout: "list" })}
              >
                <Icon name="list" />
                List
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Icon name="sort" />
                {filters.view === "review"
                  ? "Oldest first"
                  : ({
                      votes: "Most votes",
                      newest: "Newest",
                      updated: "Recently updated",
                    }[filters.sort] ?? "Newest")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={filters.sort}
                onValueChange={(sort) => navigate({ sort })}
              >
                {[
                  ["votes", "Most votes"],
                  ["newest", "Newest"],
                  ["updated", "Recently updated"],
                ].map(([value, label]) => (
                  <DropdownMenuRadioItem
                    key={value}
                    value={value}
                    disabled={filters.view === "review"}
                  >
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
