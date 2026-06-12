import { notFound, redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { WatchClient } from "./WatchClient";
import { cookies } from "next/headers";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  const cookieStore = await cookies();
  const profileId = cookieStore.get("selectedProfileId")?.value;
  if (!profileId) redirect("/profiles");

  let video;
  let streamUrl: string;

  try {
    video = await api.videos.byId({ id: videoId });
    const result = await api.videos.getStreamUrl({ id: videoId });
    streamUrl = result.url;
  } catch {
    notFound();
  }

  let startAt = 0;
  try {
    const progress = await api.watchHistory.getProgress({ videoId, profileId });
    if (progress && !progress.completed) {
      startAt = progress.watchDuration;
    }
  } catch {
    redirect("/profiles");
  }

  return (
    <WatchClient
      video={{ id: video.id, name: video.name, duration: video.duration ?? undefined }}
      streamUrl={streamUrl}
      profileId={profileId}
      startAt={startAt}
    />
  );
}
