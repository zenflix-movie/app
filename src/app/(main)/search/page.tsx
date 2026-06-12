"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";
import { VideoGrid, VideoGridSkeleton } from "~/components/video/VideoGrid";
import { api } from "~/trpc/react";
import { Search } from "lucide-react";
import { useDebounce } from "~/hooks/useDebounce";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = api.videos.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos…"
          className="pl-9"
        />
      </div>

      {debouncedQuery && isLoading && <VideoGridSkeleton />}
      {data && <VideoGrid videos={data} />}
      {debouncedQuery && !isLoading && data?.length === 0 && (
        <p className="text-muted-foreground">No results for &quot;{debouncedQuery}&quot;</p>
      )}
    </div>
  );
}
