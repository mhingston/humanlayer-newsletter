import { config as loadDotenv } from "dotenv";
import { z } from "zod";
import type { AppConfig } from "./types.js";

const EnvironmentSchema = z.object({
  FIRECRAWL_API_KEY: z.string().trim().min(1),
  SOURCE_URL: z.string().trim().min(1),
  FEED_TITLE: z.string().trim().min(1),
  FEED_DESCRIPTION: z.string().trim().min(1),
  PUBLIC_BASE_URL: z.string().trim().min(1),
  FEED_SITE_URL: z.string().trim().optional(),
  FEED_LANGUAGE: z.string().trim().optional(),
  FEED_AUTHOR: z.string().trim().optional(),
  FEED_COPYRIGHT: z.string().trim().optional(),
  ATOM_FILENAME: z.string().trim().min(1).optional(),
  RSS_FILENAME: z.string().trim().min(1).optional(),
  MAX_FEED_ITEMS: z.string().trim().optional(),
  INITIAL_ITEM_LIMIT: z.string().trim().optional(),
  EXTRACTION_HINT: z.string().trim().optional(),
  FIRECRAWL_TIMEOUT_MS: z.string().trim().optional(),
  FIRECRAWL_MAX_AGE_MS: z.string().trim().optional(),
  FIRECRAWL_ONLY_MAIN_CONTENT: z.string().trim().optional(),
  FIRECRAWL_PROXY: z.string().trim().optional(),
});

function parseHttpUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP or HTTPS URL`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must be an absolute HTTP or HTTPS URL`);
  }

  return url.toString();
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseNonNegativeInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return parsed;
}

function parseBoolean(
  value: string | undefined,
  fallback: boolean,
  name: string,
): boolean {
  if (value === undefined || value === "") {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${name} must be true or false`);
}

function optionalText(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export function loadEnvironment(): void {
  loadDotenv();
}

export function loadConfig(
  environment: Record<string, string | undefined>,
): AppConfig {
  const parsed = EnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid configuration: ${missing}`);
  }

  const values = parsed.data;
  const sourceUrl = parseHttpUrl(values.SOURCE_URL, "SOURCE_URL");
  const publicBaseUrl = parseHttpUrl(
    values.PUBLIC_BASE_URL,
    "PUBLIC_BASE_URL",
  ).replace(/\/+$/, "");
  if (!publicBaseUrl) {
    throw new Error("PUBLIC_BASE_URL must include a host");
  }

  const feedSiteUrl = values.FEED_SITE_URL
    ? parseHttpUrl(values.FEED_SITE_URL, "FEED_SITE_URL")
    : new URL(sourceUrl).origin;

  return {
    firecrawlApiKey: values.FIRECRAWL_API_KEY,
    sourceUrl,
    feedTitle: values.FEED_TITLE,
    feedDescription: values.FEED_DESCRIPTION,
    publicBaseUrl,
    feedSiteUrl,
    ...(values.FEED_LANGUAGE ? { feedLanguage: values.FEED_LANGUAGE } : {}),
    ...(optionalText(values.FEED_AUTHOR)
      ? { feedAuthor: values.FEED_AUTHOR }
      : {}),
    ...(optionalText(values.FEED_COPYRIGHT)
      ? { feedCopyright: values.FEED_COPYRIGHT }
      : {}),
    atomFilename: values.ATOM_FILENAME ?? "feed.atom.xml",
    rssFilename: values.RSS_FILENAME ?? "feed.rss.xml",
    maxFeedItems: parsePositiveInteger(
      values.MAX_FEED_ITEMS,
      100,
      "MAX_FEED_ITEMS",
    ),
    initialItemLimit: parsePositiveInteger(
      values.INITIAL_ITEM_LIMIT,
      20,
      "INITIAL_ITEM_LIMIT",
    ),
    ...(optionalText(values.EXTRACTION_HINT)
      ? { extractionHint: values.EXTRACTION_HINT }
      : {}),
    timeoutMs: parsePositiveInteger(
      values.FIRECRAWL_TIMEOUT_MS,
      120_000,
      "FIRECRAWL_TIMEOUT_MS",
    ),
    maxAgeMs: parseNonNegativeInteger(
      values.FIRECRAWL_MAX_AGE_MS,
      0,
      "FIRECRAWL_MAX_AGE_MS",
    ),
    onlyMainContent: parseBoolean(
      values.FIRECRAWL_ONLY_MAIN_CONTENT,
      true,
      "FIRECRAWL_ONLY_MAIN_CONTENT",
    ),
    proxy: values.FIRECRAWL_PROXY ?? "auto",
  };
}
