import { inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { assertProfileOwnership } from "~/server/api/helpers";
import { videos } from "~/server/db/schema";
import type { db as Database } from "~/server/db";
import { resolveMediaUrl } from "~/server/storage/rustfs";
import { getRecommendations } from "~/server/recommender/client";

const videoWithCategories = {
  videoCategories: { with: { category: true } },
} as const;

type RawVideo = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  duration: number | null;
  releaseYear: number | null;
  videoCategories: { category: { id: number; name: string } }[];
};

async function shapeVideo(video: RawVideo) {
  const { videoCategories: vc, ...rest } = video;
  const [thumbnailUrl, backdropUrl] = await Promise.all([
    resolveMediaUrl(video.thumbnailUrl),
    resolveMediaUrl(video.backdropUrl),
  ]);
  return {
    ...rest,
    thumbnailUrl,
    backdropUrl,
    categories: vc.map((row) => row.category),
  };
}

async function hydrateVideosByIds(db: typeof Database, ids: string[]) {
  if (ids.length === 0) return [];

  const rows = await db.query.videos.findMany({
    where: inArray(videos.id, ids),
    with: videoWithCategories,
  });

  const shaped = await Promise.all(rows.map(shapeVideo));
  const byId = new Map(shaped.map((v) => [v.id, v]));
  return ids.map((id) => byId.get(id)).filter((v) => v !== undefined);
}

export const recommendationsRouter = createTRPCRouter({
  forProfile: protectedProcedure
    .input(
      z.object({
        profileId: z.string().uuid(),
        topN: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertProfileOwnership(ctx.db, input.profileId, ctx.session.user.id);

      const recs = await getRecommendations(input.profileId, input.topN);
      if (!recs?.video_ids.length) return { items: [] };

      const items = await hydrateVideosByIds(ctx.db, recs.video_ids);
      return { items };
    }),
});
