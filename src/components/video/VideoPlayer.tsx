"use client";
import "@videojs/react/video/skin.css";

import { useEffect, useRef, useCallback } from "react";
import { createPlayer, videoFeatures } from "@videojs/react";
import { VideoSkin, Video } from "@videojs/react/video";

interface VideoPlayerProps {
  src: string;
  startAt?: number;
  onProgress?: (duration: number, completed: boolean) => void;
  totalDuration?: number;
}

const Player = createPlayer({ features: videoFeatures });

export function VideoPlayer({ src, startAt = 0, onProgress, totalDuration }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // const saveProgress = useCallback(() => {
  //   const video = videoRef.current;
  //   if (!video || !onProgress) return;
  //   const completed = totalDuration ? video.currentTime >= totalDuration * 0.95 : video.ended;
  //   onProgress(Math.floor(video.currentTime), completed);
  // }, [onProgress, totalDuration]);

  // useEffect(() => {
  //   const video = videoRef.current;
  //   if (!video) return;

  //   const seek = () => {
  //     if (startAt > 0) video.currentTime = startAt;
  //   };
  //   // Already loaded (fast cache) or wait for metadata
  //   if (video.readyState >= 1) seek();
  //   video.addEventListener("loadedmetadata", seek);

  //   const handleTimeUpdate = () => {
  //     if (progressTimerRef.current) return;
  //     progressTimerRef.current = setTimeout(() => {
  //       saveProgress();
  //       progressTimerRef.current = null;
  //     }, 10_000);
  //   };

  //   const handleEnded = () => saveProgress();

  //   video.addEventListener("timeupdate", handleTimeUpdate);
  //   video.addEventListener("ended", handleEnded);

  //   return () => {
  //     video.removeEventListener("loadedmetadata", seek);
  //     video.removeEventListener("timeupdate", handleTimeUpdate);
  //     video.removeEventListener("ended", handleEnded);
  //     if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
  //   };
  // }, [src, startAt, saveProgress]);

  return (
    <Player.Provider>
      <VideoSkin>
        <Video ref={videoRef} src={src} playsInline />
      </VideoSkin>
    </Player.Provider>
  );
}
