import { z } from "zod";

export const adminListInputSchema = z.object({
  query: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AdminListInput = z.infer<typeof adminListInputSchema>;

export function paginate(page: number, limit: number) {
  return { limit, offset: (page - 1) * limit };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
