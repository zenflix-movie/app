"use client";

import { Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface AdminTableControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchPlaceholder?: string;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function AdminTableControls({
  query,
  onQueryChange,
  searchPlaceholder = "Search…",
  page,
  totalPages,
  total,
  onPageChange,
  isLoading,
}: AdminTableControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {isLoading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
