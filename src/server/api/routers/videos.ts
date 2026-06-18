import { and, avg, count, eq, ilike, inArray, lt, or } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { reviews, videoCategories, videos } from "~/server/db/schema";
import { getPresignedUploadUrl, resolveMediaUrl } from "~/server/storage/rustfs";
import { scheduleTraining } from "~/server/recommender/client";
import { createVideoSchema, updateVideoSchema } from "~/lib/validations/video";

const videoWithCategories = {
  videoCategories: { with: { category: true } },
} as const;

type RawVideo = {
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  videoCategories: { category: { id: number; name: string } }[];
};

/** Flatten join rows and resolve thumbnail/backdrop URLs. */
async function shapeVideo<T extends RawVideo>(video: T) {
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

export const videosRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        categoryId: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.categoryId) {
        conditions.push(
          inArray(
            videos.id,
            ctx.db
              .select({ id: videoCategories.videoId })
              .from(videoCategories)
              .where(eq(videoCategories.categoryId, input.categoryId)),
          ),
        );
      }
      if (input.cursor) conditions.push(lt(videos.id, input.cursor));

      const rows = await ctx.db.query.videos.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        with: videoWithCategories,
        limit: input.limit + 1,
        orderBy: (v, { desc }) => desc(v.createdAt),
      });

      let nextCursor: string | undefined;
      if (rows.length > input.limit) {
        const next = rows.pop();
        nextCursor = next!.id;
      }

      const items = await Promise.all(rows.map(shapeVideo));
      return { items, nextCursor };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.videos.findMany({
        where: or(
          ilike(videos.name, `%${input.query}%`),
          ilike(videos.description, `%${input.query}%`),
        ),
        with: videoWithCategories,
        limit: input.limit,
        orderBy: (v, { desc }) => desc(v.createdAt),
      });
      return Promise.all(rows.map(shapeVideo));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const video = await ctx.db.query.videos.findFirst({
        where: eq(videos.id, input.id),
        with: videoWithCategories,
      });
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      const [stats] = await ctx.db
        .select({ avgRating: avg(reviews.rating), reviewCount: count() })
        .from(reviews)
        .where(eq(reviews.videoId, input.id));

      const shaped = await shapeVideo(video);
      return {
        ...shaped,
        avgRating: stats?.avgRating ?? null,
        reviewCount: stats?.reviewCount ?? 0,
      };
    }),

  getStreamUrl: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const video = await ctx.db.query.videos.findFirst({
        where: eq(videos.id, input.id),
      });
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      const url = await resolveMediaUrl(video.fileUrl, 7200);
      if (!url) throw new TRPCError({ code: "NOT_FOUND", message: "Stream unavailable" });

      scheduleTraining();

      return { url };
    }),

  getUploadUrl: adminProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        type: z.enum(["video", "thumbnail"]),
      }),
    )
    .mutation(async ({ input }) => {
      const key = `${input.type}s/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await getPresignedUploadUrl(key, input.contentType);
      return { url, key };
    }),

  create: adminProcedure
    .input(createVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...data } = input;
      const [video] = await ctx.db.insert(videos).values(data).returning();

      if (categoryIds?.length) {
        await ctx.db
          .insert(videoCategories)
          .values(categoryIds.map((categoryId) => ({ videoId: video!.id, categoryId })));
      }
      return video!;
    }),

  update: adminProcedure
    .input(updateVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...data } = input;

      const [updated] = await ctx.db
        .update(videos)
        .set(data)
        .where(eq(videos.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

      if (categoryIds) {
        await ctx.db.delete(videoCategories).where(eq(videoCategories.videoId, id));
        if (categoryIds.length) {
          await ctx.db
            .insert(videoCategories)
            .values(categoryIds.map((categoryId) => ({ videoId: id, categoryId })));
        }
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(videos)
        .where(eq(videos.id, input.id))
        .returning();
      if (deleted.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
