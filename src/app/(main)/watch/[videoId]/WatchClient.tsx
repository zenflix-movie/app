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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <VideoPlayer
        src={streamUrl}
        startAt={startAt}
        onProgress={handleProgress}
        totalDuration={video.duration}
      />
    </div>
  );
}
