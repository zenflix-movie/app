"use client";

import { VideoCard } from "./VideoCard";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

interface Video {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  releaseYear?: number | null;
  categories?: { id: number; name: string }[];
}

interface VideoRowProps {
  title: string;
  videos: Video[];
}

const CAROUSEL_HEIGHT = "h-[250px]";

export function VideoRow({ title, videos }: VideoRowProps) {
  if (videos.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className={`relative ${CAROUSEL_HEIGHT} overflow-hidden`}>
        <Carousel
          opts={{ align: "start", dragFree: true }}
          className="h-full w-full"
        >
          <CarouselContent className="h-full -ml-4">
            {videos.map((video) => (
              <CarouselItem
                key={video.id}
                className="h-full pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <VideoCard video={video} compact />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 size-9 bg-background/90 shadow-md border" />
          <CarouselNext className="right-0 size-9 bg-background/90 shadow-md border" />
        </Carousel>
      </div>
    </section>
  );
}

export function VideoRowSkeleton() {
  return (
    <section>
      <Skeleton className="h-6 w-48 mb-3" />
      <div className={`relative ${CAROUSEL_HEIGHT}`}>
        <div className="flex h-full gap-4 overflow-hidden px-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-full flex-1 min-w-0 space-y-2">
              <Skeleton className="aspect-video rounded-lg w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
