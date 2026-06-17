import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "~/env";

export const storageClient = new S3Client({
  endpoint: env.RUSTFS_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: env.RUSTFS_ACCESS_KEY,
    secretAccessKey: env.RUSTFS_SECRET_KEY,
  },
  forcePathStyle: true,
});

// Used only for presigning download URLs so the signature is computed against
// the host the browser will actually reach (avoids SignatureDoesNotMatch).
const publicStorageClient = env.RUSTFS_PUBLIC_URL
  ? new S3Client({
      endpoint: env.RUSTFS_PUBLIC_URL,
      region: "us-east-1",
      credentials: {
        accessKeyId: env.RUSTFS_ACCESS_KEY,
        secretAccessKey: env.RUSTFS_SECRET_KEY,
      },
      forcePathStyle: true,
    })
  : storageClient;

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.RUSTFS_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(storageClient, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.RUSTFS_BUCKET,
    Key: key,
  });
  return getSignedUrl(publicStorageClient, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await storageClient.send(
    new DeleteObjectCommand({ Bucket: env.RUSTFS_BUCKET, Key: key }),
  );
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/** Return external URLs as-is; presign S3 object keys for download. */
export async function resolveMediaUrl(
  value: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;
  return getPresignedDownloadUrl(value, expiresIn).catch(() => null);
}
