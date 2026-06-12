import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { VideoGrid, VideoGridSkeleton } from "~/components/video/VideoGrid";
import { CategoryTabs } from "~/components/layout/CategoryTabs";

interface BrowsePageProps {
  searchParams: Promise<{ category?: string }>;
}

async function VideoSection({ categoryId }: { categoryId?: number }) {
  const data = await api.videos.list({ categoryId, limit: 40 });
  return <VideoGrid videos={data.items} />;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const cookieStore = await cookies();
  if (!cookieStore.get("selectedProfileId")?.value) redirect("/profiles");

  const params = await searchParams;
  const categoryId = params.category ? parseInt(params.category) : undefined;

  void api.categories.list.prefetch();

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">Browse</h1>

        <Suspense>
          <CategoryTabs />
        </Suspense>

        <Suspense fallback={<VideoGridSkeleton />}>
          <VideoSection categoryId={categoryId} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
