import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { categories } from "~/server/db/schema";

export const categoriesRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.categories.findMany({
      orderBy: (c, { asc }) => asc(c.name),
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.id, input.id),
      });
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      return category;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [category] = await ctx.db.insert(categories).values(input).returning();
      return category!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(categories)
        .where(eq(categories.id, input.id))
        .returning();
      if (deleted.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
