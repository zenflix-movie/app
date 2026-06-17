"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "videojs-youtube";

interface YoutubeVideoPlayerProps {
  src: string;
  startAt?: number;
  onProgress?: (duration: number, completed: boolean) => void;
  totalDuration?: number;
}

export function YoutubeVideoPlayer({ src, startAt = 0 }: YoutubeVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videoEl = document.createElement("video");
    videoEl.className = "video-js vjs-big-play-centered vjs-fill";
    container.appendChild(videoEl);

    const player = videojs(videoEl, {
      techOrder: ["youtube"],
      sources: [{ src, type: "video/youtube" }],
      controls: true,
      fluid: true,
      responsive: true,
      youtube: { ytControls: 0 },
    });

    playerRef.current = player;

    if (startAt > 0) {
      player.ready(() => {
        player.currentTime(startAt);
      });
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      container.replaceChildren();
    };
  }, [src, startAt]);

  return <div ref={containerRef} data-vjs-player className="h-full w-full" />;
}
