import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";

const bodySchema = z.object({ profileId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, parsed.data.profileId),
      eq(profiles.userId, session.user.id),
    ),
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("selectedProfileId", profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
