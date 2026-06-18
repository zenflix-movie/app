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

const TRAIN_TIMEOUT_MS = 2_000;

/** Schedule retrain in the background without blocking the caller. */
export function scheduleTraining(): void {
  setImmediate(() => {
    const url = `${env.RECOMMENDER_URL}/train`;

    fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(TRAIN_TIMEOUT_MS),
    })
      .then((res) => {
        if (!res.ok && res.status !== 409) {
          console.warn(`Recommender training trigger failed: ${res.status}`);
        }
      })
      .catch(() => {
        // Unreachable or timed out — training is best-effort.
      });
  });
}
