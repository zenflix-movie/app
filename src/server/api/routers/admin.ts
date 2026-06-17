import { and, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adminListInputSchema,
  paginate,
  paginationMeta,
} from "~/lib/validations/admin";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  categories,
  profiles,
  reviews,
  users,
  videos,
} from "~/server/db/schema";

const videoWithCategories = {
  videoCategories: { with: { category: true } },
} as const;

function searchPattern(query: string) {
  return `%${query}%`;
}

export const adminRouter = createTRPCRouter({
  videos: createTRPCRouter({
    list: adminProcedure.input(adminListInputSchema).query(async ({ ctx, input }) => {
      const { limit, offset } = paginate(input.page, input.limit);
      const conditions = [];

      if (input.query) {
        const pattern = searchPattern(input.query);
        const numericQuery = Number(input.query);
        const searchConditions = [
          ilike(videos.name, pattern),
          ilike(videos.description, pattern),
          sql`cast(${videos.tmdbId} as text) ilike ${pattern}`,
        ];
        if (Number.isInteger(numericQuery) && numericQuery > 0) {
          searchConditions.push(eq(videos.tmdbId, numericQuery));
        }
        conditions.push(or(...searchConditions));
      }

      const where = conditions.length ? and(...conditions) : undefined;

      const [totalRow] = await ctx.db.select({ value: count() }).from(videos).where(where);
      const total = totalRow?.value ?? 0;

      const rows = await ctx.db.query.videos.findMany({
        where,
        with: videoWithCategories,
        limit,
        offset,
        orderBy: (v, { desc }) => desc(v.createdAt),
      });

      const items = rows.map((video) => {
        const { videoCategories: vc, ...rest } = video;
        return {
          ...rest,
          categories: vc.map((row) => row.category),
        };
      });

      return { items, ...paginationMeta(total, input.page, input.limit) };
    }),
  }),

  categories: createTRPCRouter({
    list: adminProcedure.input(adminListInputSchema).query(async ({ ctx, input }) => {
      const { limit, offset } = paginate(input.page, input.limit);
      const where = input.query
        ? or(
            ilike(categories.name, searchPattern(input.query)),
            ilike(categories.description, searchPattern(input.query)),
          )
        : undefined;

      const [totalRow] = await ctx.db
        .select({ value: count() })
        .from(categories)
        .where(where);
      const total = totalRow?.value ?? 0;

      const items = await ctx.db.query.categories.findMany({
        where,
        limit,
        offset,
        orderBy: (c, { asc }) => asc(c.name),
      });

      return { items, ...paginationMeta(total, input.page, input.limit) };
    }),
  }),

  users: createTRPCRouter({
    list: adminProcedure.input(adminListInputSchema).query(async ({ ctx, input }) => {
      const { limit, offset } = paginate(input.page, input.limit);
      const where = input.query
        ? or(
            ilike(users.name, searchPattern(input.query)),
            ilike(users.email, searchPattern(input.query)),
            ilike(users.firstName, searchPattern(input.query)),
            ilike(users.lastName, searchPattern(input.query)),
          )
        : undefined;

      const [totalRow] = await ctx.db.select({ value: count() }).from(users).where(where);
      const total = totalRow?.value ?? 0;

      const items = await ctx.db.query.users.findMany({
        where,
        limit,
        offset,
        orderBy: (u, { desc }) => desc(u.id),
      });

      return { items, ...paginationMeta(total, input.page, input.limit) };
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
    list: adminProcedure.input(adminListInputSchema).query(async ({ ctx, input }) => {
      const { limit, offset } = paginate(input.page, input.limit);
      let where;

      if (input.query) {
        const pattern = searchPattern(input.query);
        const matchingVideos = ctx.db
          .select({ id: videos.id })
          .from(videos)
          .where(ilike(videos.name, pattern));
        const matchingProfiles = ctx.db
          .select({ id: profiles.id })
          .from(profiles)
          .where(ilike(profiles.name, pattern));

        where = or(
          ilike(reviews.comment, pattern),
          inArray(reviews.videoId, matchingVideos),
          inArray(reviews.profileId, matchingProfiles),
        );
      }

      const [totalRow] = await ctx.db.select({ value: count() }).from(reviews).where(where);
      const total = totalRow?.value ?? 0;

      const rows = await ctx.db.query.reviews.findMany({
        where,
        with: { profile: true, video: true },
        limit,
        offset,
        orderBy: (r, { desc }) => desc(r.createdAt),
      });

      return { items: rows, ...paginationMeta(total, input.page, input.limit) };
    }),

    delete: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(reviews).where(eq(reviews.id, input.id));
        return { success: true };
      }),
  }),
});
