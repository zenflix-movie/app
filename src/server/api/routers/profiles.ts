import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { profiles } from "~/server/db/schema";

export const profilesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.profiles.findMany({
      where: eq(profiles.userId, ctx.session.user.id),
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.profiles.findMany({
        where: eq(profiles.userId, ctx.session.user.id),
      });
      if (existing.length >= 5) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 5 profiles allowed" });
      }
      const [profile] = await ctx.db
        .insert(profiles)
        .values({ ...input, userId: ctx.session.user.id })
        .returning();
      return profile!;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        avatarUrl: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const profile = await ctx.db.query.profiles.findFirst({
        where: and(eq(profiles.id, id), eq(profiles.userId, ctx.session.user.id)),
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const [updated] = await ctx.db
        .update(profiles)
        .set(data)
        .where(and(eq(profiles.id, id), eq(profiles.userId, ctx.session.user.id)))
        .returning();
      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.query.profiles.findFirst({
        where: and(
          eq(profiles.id, input.id),
          eq(profiles.userId, ctx.session.user.id),
        ),
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db
        .delete(profiles)
        .where(
          and(eq(profiles.id, input.id), eq(profiles.userId, ctx.session.user.id)),
        );
      return { success: true };
    }),

});
