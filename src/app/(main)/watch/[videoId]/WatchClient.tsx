"use client";

import { useCallback, useRef } from "react";
import { VideoPlayer } from "~/components/video/VideoPlayer";
import { api } from "~/trpc/react";

interface WatchClientProps {
  video: { id: string; name: string; duration?: number };
  streamUrl: string;
  profileId?: string;
  startAt?: number;
}

export function WatchClient({ video, streamUrl, profileId, startAt = 0 }: WatchClientProps) {
  const { mutate } = api.watchHistory.upsert.useMutation();
  const lastSavedRef = useRef<{ watchDuration: number; completed: boolean } | null>(null);

  const handleProgress = useCallback(
    (watchDuration: number, completed: boolean) => {
      if (!profileId) return;
      const last = lastSavedRef.current;
      if (last?.watchDuration === watchDuration && last.completed === completed) return;
      lastSavedRef.current = { watchDuration, completed };
      mutate({
        videoId: video.id,
        profileId,
        watchDuration,
        completed,
      });
    },
    [profileId, video.id, mutate],
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
