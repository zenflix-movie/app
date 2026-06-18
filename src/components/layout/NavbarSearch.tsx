"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useDebounce } from "~/hooks/useDebounce";
import { cn } from "~/lib/utils";

function NavbarSearchInput({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const userEditedRef = useRef(false);

  // Keep input in sync with browse URL when navigating back/forward.
  useEffect(() => {
    if (pathname === "/browse") {
      setQuery(searchParams.get("q") ?? "");
      userEditedRef.current = false;
    }
  }, [pathname, searchParams]);

  // Only update URL after the user types — not when leaving browse with stale input.
  useEffect(() => {
    if (!userEditedRef.current) return;

    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    }
    const qs = params.toString();
    const target = `/browse${qs ? `?${qs}` : ""}`;

    if (pathname === "/browse") {
      const current = searchParams.get("q") ?? "";
      if (debouncedQuery === current) {
        userEditedRef.current = false;
        return;
      }
      router.replace(target);
    } else {
      router.push(target);
    }

    userEditedRef.current = false;
  }, [debouncedQuery, pathname, router, searchParams]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => {
          userEditedRef.current = true;
          setQuery(e.target.value);
        }}
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
          onClick={() => {
            userEditedRef.current = true;
            setQuery("");
          }}
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
