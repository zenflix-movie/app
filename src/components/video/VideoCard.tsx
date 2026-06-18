import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatDuration } from "~/lib/utils";

interface VideoCardProps {
  video: {
    id: string;
    name: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
    releaseYear?: number | null;
    categories?: { id: number; name: string }[];
  };
  /** Fixed-height carousel layout: caps categories and prevents overflow. */
  compact?: boolean;
}

export function VideoCard({ video, compact = false }: VideoCardProps) {
  const visibleCategories = compact ? video.categories?.slice(0, 2) : video.categories;
  const hiddenCategoryCount =
    compact && video.categories ? Math.max(0, video.categories.length - 2) : 0;

  return (
    <Link href={`/video/${video.id}`} className="block group h-full">
      <Card
        className={`h-full flex flex-col gap-0 py-0 overflow-hidden ${
          compact ? "" : "transition-transform group-hover:scale-105"
        }`}
      >
        <div className="relative aspect-video shrink-0 overflow-hidden bg-muted">
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt={video.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No thumbnail
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <CardContent className={`p-3 ${compact ? "min-h-0 overflow-hidden" : ""}`}>
          <p className="font-medium text-sm line-clamp-2 leading-snug">{video.name}</p>
          <div
            className={`flex items-center gap-1.5 mt-1 ${
              compact ? "overflow-hidden whitespace-nowrap" : "flex-wrap gap-2"
            }`}
          >
            {video.releaseYear && (
              <span className="text-xs text-muted-foreground shrink-0">{video.releaseYear}</span>
            )}
            {visibleCategories?.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs shrink-0">
                {cat.name}
              </Badge>
            ))}
            {hiddenCategoryCount > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                +{hiddenCategoryCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
