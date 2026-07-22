import { describe, expect, it } from "vitest";
import { normalizeExtractedDate } from "../src/normalize/normalize-date.js";

describe("normalizeExtractedDate", () => {
  const now = new Date("2026-07-14T12:00:00.000Z");

  it("normalizes valid dates to UTC ISO values", () => {
    expect(normalizeExtractedDate("14 July 2026 11:30:00 +0100", now)).toBe(
      "2026-07-14T10:30:00.000Z",
    );
  });

  it("returns missing for invalid dates and dates more than one day ahead", () => {
    expect(normalizeExtractedDate("not a date", now)).toBeUndefined();
    expect(
      normalizeExtractedDate("2026-07-15T12:00:01.000Z", now),
    ).toBeUndefined();
  });

  it("accepts a date up to exactly one day in the future", () => {
    expect(normalizeExtractedDate("2026-07-15T12:00:00.000Z", now)).toBe(
      "2026-07-15T12:00:00.000Z",
    );
  });
});
