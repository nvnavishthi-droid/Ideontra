// IdeasTable.tsx — Manual-mode TanStack Table rendering server-prepared rows.
"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Idea } from "@/types/idea";
import { format } from "date-fns";
import { EmptyResults } from "./EmptyResults";
const column = createColumnHelper<Idea>();
const columns = [
  column.accessor("title", { header: "Idea" }),
  column.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  column.accessor("category", { header: "Category" }),
  column.accessor("votes", { header: "Votes" }),
];
// Render rows without client sorting, filtering or pagination.
export function IdeasTable({
  rows,
  onOpen,
  review = false,
  overdue = false,
  onClear,
}: {
  rows: Idea[];
  onOpen: (idea: Idea) => void;
  review?: boolean;
  overdue?: boolean;
  onClear?: () => void;
}) {
  // Keep TanStack’s mutable table instance outside React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });
  return (
    <div
      className="panel results-scroll"
      role="region"
      aria-label="Ideas table content"
      tabIndex={0}
    >
      <table className="w-full min-w-2xl text-left">
        <thead className="sticky top-0 bg-muted text-xs font-normal text-muted-foreground">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-4 py-4 font-normal">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
              <th className="px-4 font-normal">
                {review ? "Submitted" : overdue ? "Target date" : "Action"}
              </th>
              {(review || overdue) && (
                <th className="px-4 font-normal">Action</th>
              )}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-5">
                  {cell.column.id === "title" ? (
                    <button
                      className="text-left font-medium hover:text-primary"
                      onClick={() => onOpen(row.original)}
                    >
                      {row.original.title || "Untitled draft"}
                    </button>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </td>
              ))}
              {(review || overdue) && (
                <td className="px-4 text-xs text-muted-foreground">
                  {format(
                    new Date(
                      (review
                        ? row.original.submittedAt
                        : row.original.targetDate) ?? row.original.submittedAt,
                    ),
                    "dd MMM yyyy",
                  )}
                  {overdue && <p>{row.original.owner} · Overdue</p>}
                </td>
              )}
              <td className="px-4">
                <Button variant="link" onClick={() => onOpen(row.original)}>
                  {review
                    ? "Review"
                    : row.original.status === "Draft"
                      ? "Open draft"
                      : "Open idea"}
                </Button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={review || overdue ? 6 : 5}>
                {onClear ? (
                  <EmptyResults onClear={onClear} />
                ) : (
                  <div className="p-10 text-center text-muted-foreground">
                    No ideas match these filters.
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
