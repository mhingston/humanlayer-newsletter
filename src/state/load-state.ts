import { access, readFile } from "node:fs/promises";
import { z } from "zod";
import type { FeedState } from "../types.js";

const HttpUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
  );
const IsoDateSchema = z.string().datetime({ offset: true });

const FeedEntryStateSchema = z
  .object({
    id: HttpUrlSchema,
    url: HttpUrlSchema,
    title: z.string().min(1),
    publishedAt: IsoDateSchema.optional(),
    updatedAt: IsoDateSchema.optional(),
    firstSeenAt: IsoDateSchema,
    summary: z.string().optional(),
    author: z.string().optional(),
  })
  .strict()
  .refine((entry) => entry.id === entry.url, "Entry id must equal entry URL");

export const FeedStateSchema = z
  .object({
    version: z.literal(1),
    sourceUrl: HttpUrlSchema,
    entries: z.array(FeedEntryStateSchema),
  })
  .strict();

export class StateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateValidationError";
  }
}

export async function loadState(path: string): Promise<FeedState | null> {
  try {
    await access(path);
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }
    throw new StateValidationError(
      `Unable to access state file: ${errorMessage(error)}`,
    );
  }

  let contents: string;
  try {
    contents = await readFile(path, "utf8");
  } catch (error) {
    throw new StateValidationError(
      `Unable to read state file: ${errorMessage(error)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents) as unknown;
  } catch {
    throw new StateValidationError("State file is not valid JSON");
  }

  const validated = FeedStateSchema.safeParse(parsed);
  if (!validated.success) {
    throw new StateValidationError(
      "State file does not match the expected schema",
    );
  }

  return validated.data;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
