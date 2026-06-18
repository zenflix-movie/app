import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { resolveMediaUrl } from "~/server/storage/rustfs";
import { Badge } from "~/components/ui/badge";
import { formatDuration } from "~/lib/utils";

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("selectedProfileId")?.value;
  if (!profileId) redirect("/profiles");

  let history;
  try {
    history = await api.watchHistory.listByProfile({ profileId });
  } catch {
    // Stale cookie pointing at a deleted/foreign profile
    redirect("/profiles");
  }

  const entries = await Promise.all(
    history.map(async (entry) => ({
      ...entry,
      video: {
        ...entry.video,
        thumbnailUrl: await resolveMediaUrl(entry.video.thumbnailUrl),
        categories: entry.video.videoCategories.map((row) => row.category),
      },
    })),
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">My List</h1>

      {entries.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          Nothing here yet — start watching something on the{" "}
          <Link href="/browse" className="text-primary underline underline-offset-4">
            Browse
          </Link>{" "}
          page.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map((entry) => {
            const progress =
              entry.video.duration && entry.video.duration > 0
                ? Math.min(100, Math.round((entry.watchDuration / entry.video.duration) * 100))
                : 0;

            return (
              <Link
                key={entry.id}
                href={`/video/${entry.video.id}`}
                className="block group"
              >
                <div className="rounded-lg border overflow-hidden transition-transform group-hover:scale-105">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {entry.video.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.video.thumbnailUrl}
                        alt={entry.video.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                        No thumbnail
                      </div>
                    )}
                    {entry.completed ? (
                      <Badge className="absolute top-1 right-1">Watched</Badge>
                    ) : (
                      progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-medium text-sm line-clamp-2 leading-snug">
                      {entry.video.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.video.releaseYear && (
                        <span className="text-xs text-muted-foreground">
                          {entry.video.releaseYear}
                        </span>
                      )}
                      {entry.video.categories.map((cat) => (
                        <Badge key={cat.id} variant="secondary" className="text-xs">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.completed
                        ? "Completed"
                        : `${formatDuration(entry.watchDuration)} watched`}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
