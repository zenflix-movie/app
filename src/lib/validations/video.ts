import { z } from "zod";

export const createVideoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  releaseYear: z.number().int().min(1888).max(2100).optional(),
  fileUrl: z.string().min(1, "File URL is required"),
  thumbnailUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  tmdbId: z.number().int().positive(),
  categoryIds: z.array(z.number().int().positive()).optional(),
});

export const updateVideoSchema = createVideoSchema.partial().extend({
  id: z.string().uuid(),
});

export const searchVideosSchema = z.object({
  query: z.string().min(1),
  categoryId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type SearchVideosInput = z.infer<typeof searchVideosSchema>;
