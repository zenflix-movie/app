import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { reviews } from "~/server/db/schema";
import { createReviewSchema, updateReviewSchema } from "~/lib/validations/review";

export const reviewsRouter = createTRPCRouter({
  listByVideo: publicProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.reviews.findMany({
        where: eq(reviews.videoId, input.videoId),
        with: { user: true },
        limit: input.limit + 1,
        orderBy: (r, { desc }) => desc(r.createdAt),
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop();
        nextCursor = next!.id;
      }

      return { items, nextCursor };
    }),

  myReview: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.reviews.findFirst({
        where: and(
          eq(reviews.videoId, input.videoId),
          eq(reviews.userId, ctx.session.user.id),
        ),
      });
    }),

  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const [review] = await ctx.db
        .insert(reviews)
        .values({ ...input, userId: ctx.session.user.id })
        .onConflictDoUpdate({
          target: [reviews.videoId, reviews.userId],
          set: { rating: input.rating, comment: input.comment },
        })
        .returning();
      return review!;
    }),

  update: protectedProcedure
    .input(updateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const review = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.id, id),
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      if (review.userId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(reviews)
        .set(data)
        .where(eq(reviews.id, id))
        .returning();
      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.id, input.id),
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      if (review.userId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),
});
