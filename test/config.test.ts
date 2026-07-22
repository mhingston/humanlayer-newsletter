import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const required = {
  FIRECRAWL_API_KEY: "fc-example",
  SOURCE_URL: "https://example.com/news",
  FEED_TITLE: "Example News",
  FEED_DESCRIPTION: "New entries published by Example",
  PUBLIC_BASE_URL: "https://username.github.io/repository/",
};

describe("loadConfig", () => {
  it("validates required values and applies optional defaults", () => {
    const config = loadConfig(required);

    expect(config.sourceUrl).toBe("https://example.com/news");
    expect(config.publicBaseUrl).toBe("https://username.github.io/repository");
    expect(config.feedSiteUrl).toBe("https://example.com");
    expect(config.maxFeedItems).toBe(100);
    expect(config.initialItemLimit).toBe(20);
    expect(config.maxAgeMs).toBe(0);
    expect(config.onlyMainContent).toBe(true);
    expect(config.proxy).toBe("auto");
  });

  it("ignores unknown variables", () => {
    expect(() =>
      loadConfig({ ...required, UNKNOWN_VALUE: "ignored" }),
    ).not.toThrow();
  });

  it("rejects invalid required URLs before a client can be created", () => {
    expect(() =>
      loadConfig({ ...required, SOURCE_URL: "file:///tmp/news" }),
    ).toThrow("SOURCE_URL must be an absolute HTTP or HTTPS URL");
    expect(() =>
      loadConfig({ ...required, PUBLIC_BASE_URL: "not a URL" }),
    ).toThrow("PUBLIC_BASE_URL must be an absolute HTTP or HTTPS URL");
  });
});
