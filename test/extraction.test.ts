import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { extractEntries } from "../src/extraction/extract-entries.js";
import type { AppConfig } from "../src/types.js";

const config: AppConfig = {
  firecrawlApiKey: "fc-test",
  sourceUrl: "https://example.com/news",
  feedTitle: "Example News",
  feedDescription: "Visible updates",
  publicBaseUrl: "https://user.github.io/repo",
  feedSiteUrl: "https://example.com",
  atomFilename: "feed.atom.xml",
  rssFilename: "feed.rss.xml",
  maxFeedItems: 100,
  initialItemLimit: 20,
  extractionHint: "Prefer release cards.",
  timeoutMs: 120_000,
  maxAgeMs: 0,
  onlyMainContent: true,
  proxy: "auto",
};

describe("extractEntries", () => {
  it("validates a saved Firecrawl JSON response and normalizes accepted entries", async () => {
    const fixture = JSON.parse(
      await readFile(
        new URL("./fixtures/firecrawl-response.json", import.meta.url),
        "utf8",
      ),
    ) as unknown;
    let seenOptions: Record<string, unknown> | undefined;
    const result = await extractEntries(
      {
        scrape: async (_url, options) => {
          seenOptions = options as unknown as Record<string, unknown>;
          return fixture;
        },
      },
      config,
      "2026-07-14T09:00:00.000Z",
      new Date("2026-07-14T09:00:00.000Z"),
    );

    expect(result.returnedCount).toBe(4);
    expect(result.rejectedCount).toBe(2);
    expect(result.entries.map((entry) => entry.id)).toEqual([
      "https://example.com/first",
      "https://external.example/item?ref=important",
    ]);
    const formats = seenOptions?.formats as Array<{
      type: string;
      prompt?: string;
    }>;
    expect(formats[0]?.type).toBe("json");
    expect(formats[0]?.prompt).toContain("Prefer release cards.");
  });

  it("rejects an absent structured response", async () => {
    await expect(
      extractEntries(
        { scrape: async () => ({ success: true }) },
        config,
        "2026-07-14T09:00:00.000Z",
        new Date("2026-07-14T09:00:00.000Z"),
      ),
    ).rejects.toThrow("structured JSON response was absent");
  });
});
