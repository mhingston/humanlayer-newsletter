import { z } from "zod";

export const ExtractedEntrySchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  publishedAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
});

export const ExtractedPageSchema = z.object({
  entries: z.array(ExtractedEntrySchema),
});
