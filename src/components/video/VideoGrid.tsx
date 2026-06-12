import { VideoCard } from "./VideoCard";
import { Skeleton } from "~/components/ui/skeleton";

interface Video {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  releaseYear?: number | null;
  categories?: { id: number; name: string }[];
}

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">No videos found.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

export function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-video rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
