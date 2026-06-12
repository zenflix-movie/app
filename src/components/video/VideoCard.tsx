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
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/video/${video.id}`} className="block group">
      <Card className="overflow-hidden transition-transform group-hover:scale-105">
        <div className="relative aspect-video bg-muted">
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt={video.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No thumbnail
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <CardContent className="p-3">
          <p className="font-medium text-sm line-clamp-2 leading-snug">{video.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {video.releaseYear && (
              <span className="text-xs text-muted-foreground">{video.releaseYear}</span>
            )}
            {video.categories?.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
