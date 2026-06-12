import { type NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "~/server/auth";
import { storageClient } from "~/server/storage/rustfs";
import { env } from "~/env";

const LIMITS = {
  video: { maxBytes: 2 * 1024 * 1024 * 1024, mimePrefix: "video/" }, // 2 GB
  thumbnail: { maxBytes: 10 * 1024 * 1024, mimePrefix: "image/" }, // 10 MB
} as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as keyof typeof LIMITS | null;

  if (!file || !type || !(type in LIMITS)) {
    return NextResponse.json({ error: "Missing file or invalid type" }, { status: 400 });
  }

  const { maxBytes, mimePrefix } = LIMITS[type];

  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)} MB)` },
      { status: 413 },
    );
  }

  if (!file.type.startsWith(mimePrefix)) {
    return NextResponse.json(
      { error: `Expected a ${mimePrefix}* file, got ${file.type || "unknown"}` },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${type}s/${Date.now()}-${safeName}`;

  const bytes = await file.arrayBuffer();

  await storageClient.send(
    new PutObjectCommand({
      Bucket: env.RUSTFS_BUCKET,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    }),
  );

  return NextResponse.json({ key });
}
