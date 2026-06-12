import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { reviews, users } from "~/server/db/schema";

export const adminRouter = createTRPCRouter({
  users: createTRPCRouter({
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const items = await ctx.db.query.users.findMany({
          limit: input.limit + 1,
          orderBy: (u, { desc }) => desc(u.id),
        });

        let nextCursor: string | undefined;
        if (items.length > input.limit) {
          const next = items.pop();
          nextCursor = next!.id;
        }

        return { items, nextCursor };
      }),

    updateRole: adminProcedure
      .input(
        z.object({
          id: z.string(),
          role: z.enum(["member", "admin"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.id))
          .returning();
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        return updated;
      }),
  }),

  reviews: createTRPCRouter({
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(50),
        }),
      )
      .query(async ({ ctx, input }) => {
        return ctx.db.query.reviews.findMany({
          with: { user: true, video: true },
          limit: input.limit,
          orderBy: (r, { desc }) => desc(r.createdAt),
        });
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(reviews).where(eq(reviews.id, input.id));
        return { success: true };
      }),
  }),
});
