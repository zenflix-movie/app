import { env } from "~/env";

type RecommendationResponse = {
  profile_id: string;
  video_ids: string[];
};

export async function getRecommendations(
  profileId: string,
  topN = 20,
): Promise<RecommendationResponse | null> {
  const url = `${env.RECOMMENDER_URL}/recommendations/${profileId}?top_n=${topN}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RecommendationResponse;
  } catch {
    return null;
  }
}

/** Fire-and-forget retrain trigger. 202 = started, 409 = already running. */
export async function triggerTraining(): Promise<void> {
  const url = `${env.RECOMMENDER_URL}/train`;

  try {
    const res = await fetch(url, { method: "POST", cache: "no-store" });
    if (!res.ok && res.status !== 409) {
      console.warn(`Recommender training trigger failed: ${res.status}`);
    }
  } catch (err) {
    console.warn("Recommender training trigger unreachable:", err);
  }
}
