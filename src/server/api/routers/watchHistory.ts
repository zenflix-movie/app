import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { profiles, watchHistory } from "~/server/db/schema";
import type { db as Database } from "~/server/db";

async function assertProfileOwnership(
  db: typeof Database,
  profileId: string,
  userId: string,
) {
  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.userId, userId)),
  });
  if (!profile) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Profile does not belong to you" });
  }
}

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

      return ctx.db.query.watchHistory.findFirst({
        where: and(
          eq(watchHistory.videoId, input.videoId),
          eq(watchHistory.profileId, input.profileId),
        ),
      });
    }),
});
