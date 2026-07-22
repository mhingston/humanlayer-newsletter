import { describe, expect, it } from "vitest";
import { normalizeCanonicalUrl } from "../src/normalize/normalize-url.js";

describe("normalizeCanonicalUrl", () => {
  const sourceUrl = "https://example.com/news/listing";

  it("resolves relative URLs and removes fragments and tracking parameters", () => {
    expect(
      normalizeCanonicalUrl(
        "../entry?id=42&utm_source=newsletter&fbclid=tracking#comments",
        sourceUrl,
      ),
    ).toBe("https://example.com/entry?id=42");
  });

  it("preserves meaningful query parameters and trailing slashes", () => {
    expect(
      normalizeCanonicalUrl(
        "https://example.com/item/?page=2&gclid=tracking&filter=latest",
        sourceUrl,
      ),
    ).toBe("https://example.com/item/?page=2&filter=latest");
  });

  it("accepts external HTTP URLs but rejects unsupported and malformed values", () => {
    expect(
      normalizeCanonicalUrl("http://external.test/article", sourceUrl),
    ).toBe("http://external.test/article");
    expect(normalizeCanonicalUrl("javascript:alert(1)", sourceUrl)).toBeNull();
    expect(normalizeCanonicalUrl("not a url", sourceUrl)).toBeNull();
  });
});
