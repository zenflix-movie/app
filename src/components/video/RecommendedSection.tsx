import { api } from "~/trpc/server";
import { VideoRow } from "./VideoRow";

interface RecommendedSectionProps {
  profileId: string;
}

export async function RecommendedSection({ profileId }: RecommendedSectionProps) {
  const { items } = await api.recommendations.forProfile({ profileId, topN: 20 });
  if (items.length === 0) return null;
  return <VideoRow title="Recommended for you" videos={items} />;
}
