import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { registerSchema } from "~/lib/validations/auth";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
      }

      const passwordHash = await hash(input.password, 12);
      const [user] = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          name: `${input.firstName} ${input.lastName}`,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
          passwordHash,
          role: "member",
        })
        .returning();

      return { id: user!.id, email: user!.email, name: user!.name };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      with: { profiles: true },
    });
    return user;
  }),
});
