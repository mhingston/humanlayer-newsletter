import { Firecrawl } from "firecrawl";
import type { ScrapeOptions } from "firecrawl";
import type { AppConfig } from "../types.js";
import { ExtractedPageSchema } from "./schemas.js";
import { buildExtractionPrompt } from "./prompt.js";

export interface FirecrawlClientLike {
  scrape(url: string, options: ScrapeOptions): Promise<unknown>;
}

export function createFirecrawlClient(config: AppConfig): FirecrawlClientLike {
  const client = new Firecrawl({ apiKey: config.firecrawlApiKey });
  return {
    scrape: (url, options) => client.scrape(url, options),
  };
}

export function buildScrapeOptions(config: AppConfig): ScrapeOptions {
  return {
    formats: [
      {
        type: "json",
        schema: ExtractedPageSchema,
        prompt: buildExtractionPrompt(config.extractionHint),
      },
    ],
    onlyMainContent: config.onlyMainContent,
    maxAge: config.maxAgeMs,
    proxy: config.proxy,
    timeout: config.timeoutMs,
  };
}

export async function requestExtraction(
  client: FirecrawlClientLike,
  config: AppConfig,
): Promise<unknown> {
  return client.scrape(config.sourceUrl, buildScrapeOptions(config));
}
