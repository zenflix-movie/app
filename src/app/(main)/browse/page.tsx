import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { VideoGrid, VideoGridSkeleton } from "~/components/video/VideoGrid";
import { VideoRowSkeleton } from "~/components/video/VideoRow";
import { RecommendedSection } from "~/components/video/RecommendedSection";
import { CategoryTabs } from "~/components/layout/CategoryTabs";

interface BrowsePageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

async function VideoSection({ categoryId }: { categoryId?: number }) {
  const data = await api.videos.list({ categoryId, limit: 40 });
  return <VideoGrid videos={data.items} />;
}

async function SearchSection({ query }: { query: string }) {
  const videos = await api.videos.search({ query });
  if (videos.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        No results for &quot;{query}&quot;
      </p>
    );
  }
  return <VideoGrid videos={videos} />;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("selectedProfileId")?.value;
  if (!profileId) redirect("/profiles");

  const params = await searchParams;
  const categoryId = params.category ? parseInt(params.category) : undefined;
  const searchQuery = params.q?.trim() ?? "";
  const isSearching = searchQuery.length > 0;

  void api.categories.list.prefetch();

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">
          {isSearching ? `Results for "${searchQuery}"` : "Browse"}
        </h1>

        {isSearching ? (
          <Suspense fallback={<VideoGridSkeleton />} key={searchQuery}>
            <SearchSection query={searchQuery} />
          </Suspense>
        ) : (
          <>
            <Suspense fallback={<VideoRowSkeleton />}>
              <div className="mb-12">
                <RecommendedSection profileId={profileId} />
              </div>
            </Suspense>

            <Suspense>
              <CategoryTabs />
            </Suspense>

            <Suspense fallback={<VideoGridSkeleton />}>
              <VideoSection categoryId={categoryId} />
            </Suspense>
          </>
        )}
      </div>
    </HydrateClient>
  );
}
