"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useDebounce } from "~/hooks/useDebounce";
import { cn } from "~/lib/utils";

function NavbarSearchInput({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedQuery === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
      params.delete("category");
    } else {
      params.delete("q");
    }

    const qs = params.toString();
    router.replace(`/browse${qs ? `?${qs}` : ""}`);
  }, [debouncedQuery, router, searchParams]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search videos…"
        className="h-9 pl-8 pr-8"
        aria-label="Search videos"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9"
          onClick={() => setQuery("")}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function NavbarSearch({ className }: { className?: string }) {
  return (
    <Suspense
      fallback={
        <div className={cn("relative w-full", className)}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search videos…" className="h-9 pl-8" disabled />
        </div>
      }
    >
      <NavbarSearchInput className={className} />
    </Suspense>
  );
}
