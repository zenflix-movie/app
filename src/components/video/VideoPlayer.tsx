"use client";
import "@videojs/react/video/skin.css";

import { createPlayer, videoFeatures } from "@videojs/react";
import { Video, VideoSkin } from "@videojs/react/video";
import { useEffect, useRef } from "react";

import { isYoutubeUrl } from "~/lib/video";
import { YoutubeVideoPlayer } from "./YoutubeVideoPlayer";

interface VideoPlayerProps {
  src: string;
  startAt?: number;
  onProgress?: (duration: number, completed: boolean) => void;
  totalDuration?: number;
}

const Player = createPlayer({ features: videoFeatures });

export function VideoPlayer(props: VideoPlayerProps) {
  if (isYoutubeUrl(props.src)) {
    return <YoutubeVideoPlayer {...props} />;
  }
  return <NativeVideoPlayer {...props} />;
}

function NativeVideoPlayer({ src, startAt = 0, onProgress, totalDuration }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onProgressRef = useRef(onProgress);
  const totalDurationRef = useRef(totalDuration);
  onProgressRef.current = onProgress;
  totalDurationRef.current = totalDuration;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const saveProgress = () => {
      if (!onProgressRef.current) return;
      const duration = totalDurationRef.current;
      const completed = duration ? video.currentTime >= duration * 0.95 : video.ended;
      onProgressRef.current(Math.floor(video.currentTime), completed);
    };

    const seek = () => {
      if (startAt > 0) video.currentTime = startAt;
    };
    if (video.readyState >= 1) seek();
    video.addEventListener("loadedmetadata", seek);

    const handleTimeUpdate = () => {
      if (progressTimerRef.current) return;
      progressTimerRef.current = setTimeout(() => {
        saveProgress();
        progressTimerRef.current = null;
      }, 10_000);
    };

    const handleEnded = () => saveProgress();

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      saveProgress();
      video.removeEventListener("loadedmetadata", seek);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, [src, startAt]);

  return (
    <Player.Provider>
      <VideoSkin>
        <Video ref={videoRef} src={src} playsInline />
      </VideoSkin>
    </Player.Provider>
  );
}
