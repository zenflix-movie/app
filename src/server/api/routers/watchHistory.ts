import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { assertProfileOwnership } from "~/server/api/helpers";
import { watchHistory } from "~/server/db/schema";

export const watchHistoryRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        profileId: z.string().uuid(),
        watchDuration: z.number().int().min(0),
        completed: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProfileOwnership(ctx.db, input.profileId, ctx.session.user.id);

      const [entry] = await ctx.db
        .insert(watchHistory)
        .values({
          ...input,
          lastWatchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [watchHistory.videoId, watchHistory.profileId],
          set: {
            watchDuration: input.watchDuration,
            completed: input.completed,
            lastWatchedAt: new Date(),
          },
        })
        .returning();
      return entry!;
    }),

  listByProfile: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertProfileOwnership(ctx.db, input.profileId, ctx.session.user.id);

      return ctx.db.query.watchHistory.findMany({
        where: eq(watchHistory.profileId, input.profileId),
        with: { video: true },
        orderBy: (wh, { desc }) => desc(wh.lastWatchedAt),
      });
    }),

  getProgress: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        profileId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertProfileOwnership(ctx.db, input.profileId, ctx.session.user.id);

      const entry = await ctx.db.query.watchHistory.findFirst({
        where: and(
          eq(watchHistory.videoId, input.videoId),
          eq(watchHistory.profileId, input.profileId),
        ),
      });
      return entry ?? null;
    }),
});
