import { normalizeExtractedDate } from "./normalize-date.js";
import { normalizeCanonicalUrl } from "./normalize-url.js";
import type {
  ExtractedPage,
  FeedEntry,
  NormalizedExtraction,
} from "../types.js";

function normalizeOptionalText(
  value: string | null | undefined,
): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeExtractedEntries(
  page: ExtractedPage,
  sourceUrl: string,
  firstSeenAt: string,
  now: Date,
): NormalizedExtraction {
  const entries: FeedEntry[] = [];
  const seenIds = new Set<string>();
  let rejectedCount = 0;

  for (const extracted of page.entries) {
    const title = extracted.title.trim();
    const url = normalizeCanonicalUrl(extracted.url, sourceUrl);
    if (!title || !url || seenIds.has(url)) {
      rejectedCount += 1;
      continue;
    }

    seenIds.add(url);
    const publishedAt = normalizeExtractedDate(extracted.publishedAt, now);
    const updatedAt = normalizeExtractedDate(extracted.updatedAt, now);
    const summary = normalizeOptionalText(extracted.summary);
    const author = normalizeOptionalText(extracted.author);
    entries.push({
      id: url,
      url,
      title,
      firstSeenAt,
      ...(publishedAt ? { publishedAt } : {}),
      ...(updatedAt ? { updatedAt } : {}),
      ...(summary ? { summary } : {}),
      ...(author ? { author } : {}),
    });
  }

  return {
    entries,
    returnedCount: page.entries.length,
    rejectedCount,
  };
}
