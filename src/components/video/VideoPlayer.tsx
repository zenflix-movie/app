"use client";

import { useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string;
  startAt?: number;
  onProgress?: (duration: number, completed: boolean) => void;
  totalDuration?: number;
}

export function VideoPlayer({ src, startAt = 0, onProgress, totalDuration }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;
    const completed = totalDuration ? video.currentTime >= totalDuration * 0.95 : video.ended;
    onProgress(Math.floor(video.currentTime), completed);
  }, [onProgress, totalDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // HLS.js is only for .m3u8 manifests — feeding it a plain MP4/MOV fails.
    const isHlsSource = new URL(src, window.location.origin).pathname.endsWith(".m3u8");

    if (isHlsSource && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.currentTime = startAt;
      });
    } else {
      // Direct file (MP4/MOV/WebM) or Safari native HLS
      video.src = src;
      const seek = () => {
        video.currentTime = startAt;
        video.removeEventListener("loadedmetadata", seek);
      };
      video.addEventListener("loadedmetadata", seek);
    }

    const handleTimeUpdate = () => {
      if (progressTimerRef.current) return;
      progressTimerRef.current = setTimeout(() => {
        saveProgress();
        progressTimerRef.current = null;
      }, 10_000);
    };

    const handleEnded = () => {
      saveProgress();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      hlsRef.current?.destroy();
    };
  }, [src, startAt, saveProgress]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full h-full bg-black"
      playsInline
    />
  );
}
