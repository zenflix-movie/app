import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { profiles } from "~/server/db/schema";
import type { db as Database } from "~/server/db";

export async function assertProfileOwnership(
  db: typeof Database,
  profileId: string,
  userId: string,
) {
  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.userId, userId)),
  });
  if (!profile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Profile does not belong to you",
    });
  }
  return profile;
}
