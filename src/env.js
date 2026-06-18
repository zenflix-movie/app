import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    RUSTFS_ENDPOINT: z.string().url().default("http://localhost:9000"),
    RUSTFS_ACCESS_KEY: z.string().default("minioadmin"),
    RUSTFS_SECRET_KEY: z.string().default("minioadmin"),
    RUSTFS_BUCKET: z.string().default("zenflix"),
    RUSTFS_PUBLIC_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    RECOMMENDER_URL: z.string().url().default("http://localhost:8000"),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    RUSTFS_ENDPOINT: process.env.RUSTFS_ENDPOINT,
    RUSTFS_ACCESS_KEY: process.env.RUSTFS_ACCESS_KEY,
    RUSTFS_SECRET_KEY: process.env.RUSTFS_SECRET_KEY,
    RUSTFS_BUCKET: process.env.RUSTFS_BUCKET,
    RUSTFS_PUBLIC_URL: process.env.RUSTFS_PUBLIC_URL,
    REDIS_URL: process.env.REDIS_URL,
    RECOMMENDER_URL: process.env.RECOMMENDER_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Set SKIP_ENV_VALIDATION to skip validation (used by the Docker build).
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
