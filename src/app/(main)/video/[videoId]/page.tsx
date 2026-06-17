import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ReviewList } from "~/components/review/ReviewList";
import { ReviewFormSection } from "./ReviewFormSection";
import { auth } from "~/server/auth";
import { formatDuration } from "~/lib/utils";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const session = await auth();
  const cookieStore = await cookies();
  const profileId = cookieStore.get("selectedProfileId")?.value;

  let video;
  try {
    video = await api.videos.byId({ id: videoId });
  } catch {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const backdropUrl = video.backdropUrl || video.thumbnailUrl;

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {backdropUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backdropUrl}
              alt={video.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4 sm:p-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{video.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {video.releaseYear && (
                  <span className="text-white/80 text-sm">{video.releaseYear}</span>
                )}
                {video.duration && (
                  <span className="text-white/80 text-sm">{formatDuration(video.duration)}</span>
                )}
                {video.categories.map((cat) => (
                  <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                ))}
                {video.avgRating && (
                  <span className="text-yellow-400 text-sm">
                    ★ {Number(video.avgRating).toFixed(1)} ({video.reviewCount} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {session?.user && (
          <Button asChild size="lg">
            <Link href={`/watch/${videoId}`}>▶ Play</Link>
          </Button>
        )}

        {video.description && (
          <p className="text-muted-foreground leading-relaxed">{video.description}</p>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Reviews</h2>
          {session?.user && profileId && (
            <ReviewFormSection videoId={videoId} profileId={profileId} />
          )}
          <ReviewList videoId={videoId} />
        </div>
      </div>
    </HydrateClient>
  );
}
