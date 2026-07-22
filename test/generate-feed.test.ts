import { describe, expect, it } from "vitest";
import { generateFeeds } from "../src/feed/generate-feed.js";
import type { AppConfig, FeedState } from "../src/types.js";

const config: AppConfig = {
  firecrawlApiKey: "fc-test",
  sourceUrl: "https://example.com/news",
  feedTitle: "Example & News",
  feedDescription: "Visible updates",
  publicBaseUrl: "https://user.github.io/repo",
  feedSiteUrl: "https://example.com",
  feedLanguage: "en-GB",
  atomFilename: "feed.atom.xml",
  rssFilename: "feed.rss.xml",
  maxFeedItems: 100,
  initialItemLimit: 20,
  timeoutMs: 120_000,
  maxAgeMs: 0,
  onlyMainContent: true,
  proxy: "auto",
};

const state: FeedState = {
  version: 1,
  sourceUrl: config.sourceUrl,
  entries: [
    {
      id: "https://example.com/older",
      url: "https://example.com/older",
      title: "Older",
      firstSeenAt: "2026-07-13T09:00:00.000Z",
      publishedAt: "2026-07-13T08:00:00.000Z",
    },
    {
      id: "https://example.com/newer",
      url: "https://example.com/newer",
      title: "Newer",
      firstSeenAt: "2026-07-14T09:00:00.000Z",
      publishedAt: "2026-07-14T08:00:00.000Z",
      summary: "A summary",
      author: "A. Writer",
    },
  ],
};

describe("generateFeeds", () => {
  it("generates deterministic Atom and RSS XML with newest entries first", () => {
    const first = generateFeeds(config, state);
    const second = generateFeeds(config, state);

    expect(first.atom).toBe(second.atom);
    expect(first.rss).toBe(second.rss);
    expect(first.atom).toContain("https://user.github.io/repo/feed.atom.xml");
    expect(first.rss).toContain("https://user.github.io/repo/feed.rss.xml");
    expect(first.atom.indexOf("Newer")).toBeLessThan(
      first.atom.indexOf("Older"),
    );
    expect(first.rss.indexOf("Newer")).toBeLessThan(first.rss.indexOf("Older"));
    expect(first.index).toContain("Retained entries: 2");
    expect(first.index).toContain("https://example.com/news");
  });
});
