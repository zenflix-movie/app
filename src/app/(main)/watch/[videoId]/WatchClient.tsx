"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { VideoPlayer } from "~/components/video/VideoPlayer";
import { api } from "~/trpc/react";

interface WatchClientProps {
  video: { id: string; name: string; duration?: number };
  streamUrl: string;
  profileId?: string;
  startAt?: number;
}

export function WatchClient({ video, streamUrl, profileId, startAt = 0 }: WatchClientProps) {
  const upsertProgress = api.watchHistory.upsert.useMutation();

  const handleProgress = useCallback(
    (watchDuration: number, completed: boolean) => {
      if (!profileId) return;
      upsertProgress.mutate({
        videoId: video.id,
        profileId,
        watchDuration,
        completed,
      });
    },
    [profileId, video.id, upsertProgress],
  );

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-black/50 absolute top-0 left-0 z-10">
        <Link
          href={`/video/${video.id}`}
          className="text-white/80 hover:text-white flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="text-white font-medium text-sm">{video.name}</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <VideoPlayer
          src={streamUrl}
          startAt={startAt}
          onProgress={handleProgress}
          totalDuration={video.duration}
        />
      </div>
    </div>
  );
}
