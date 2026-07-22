import {
  requestExtraction,
  type FirecrawlClientLike,
} from "./firecrawl-client.js";
import { ExtractedPageSchema } from "./schemas.js";
import { normalizeExtractedEntries } from "../normalize/normalize-entry.js";
import type { AppConfig, NormalizedExtraction } from "../types.js";

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function extractEntries(
  client: FirecrawlClientLike,
  config: AppConfig,
  firstSeenAt: string,
  now: Date,
): Promise<NormalizedExtraction> {
  let response: unknown;
  try {
    response = await requestExtraction(client, config);
  } catch {
    throw new ExtractionError("Firecrawl API or extraction request failed");
  }

  const json = isRecord(response) ? response.json : undefined;
  if (json === undefined || json === null) {
    throw new ExtractionError("Firecrawl structured JSON response was absent");
  }

  const parsed = ExtractedPageSchema.safeParse(json);
  if (!parsed.success) {
    throw new ExtractionError(
      "Firecrawl structured JSON failed schema validation",
    );
  }

  const normalized = normalizeExtractedEntries(
    parsed.data,
    config.sourceUrl,
    firstSeenAt,
    now,
  );
  if (normalized.entries.length === 0) {
    throw new ExtractionError(
      "Firecrawl extraction returned zero valid entries",
    );
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
