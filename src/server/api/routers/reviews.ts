import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { assertProfileOwnership } from "~/server/api/helpers";
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
        with: { profile: true },
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
    .input(z.object({ videoId: z.string().uuid(), profileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertProfileOwnership(ctx.db, input.profileId, ctx.session.user.id);

      return ctx.db.query.reviews.findFirst({
        where: and(
          eq(reviews.videoId, input.videoId),
          eq(reviews.profileId, input.profileId),
        ),
      });
    }),

  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      await assertProfileOwnership(ctx.db, input.profileId, ctx.session.user.id);

      const [review] = await ctx.db
        .insert(reviews)
        .values(input)
        .onConflictDoUpdate({
          target: [reviews.videoId, reviews.profileId],
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
        with: { profile: true },
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      if (
        review.profile.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "admin"
      ) {
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
        with: { profile: true },
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      if (
        review.profile.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),
});
