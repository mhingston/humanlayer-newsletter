import { describe, expect, it } from "vitest";
import { initializeState, mergeState } from "../src/state/merge-state.js";
import type { FeedEntry } from "../src/types.js";

const firstSeenAt = "2026-07-14T09:00:00.000Z";

function entry(id: string, title = id): FeedEntry {
  return { id, url: id, title, firstSeenAt };
}

describe("state merging", () => {
  it("initializes with the latest visible entries up to the initial limit", () => {
    const state = initializeState(
      "https://example.com/news",
      [entry("https://example.com/1"), entry("https://example.com/2")],
      1,
    );

    expect(state.entries.map((item) => item.id)).toEqual([
      "https://example.com/1",
    ]);
  });

  it("adds unseen entries and retains the configured maximum", () => {
    const state = initializeState(
      "https://example.com/news",
      [entry("https://example.com/old")],
      10,
    );
    const result = mergeState(
      state,
      [
        entry("https://example.com/new"),
        entry("https://example.com/old", "changed"),
      ],
      2,
    );

    expect(result.newEntries.map((item) => item.id)).toEqual([
      "https://example.com/new",
    ]);
    expect(result.state.entries.map((item) => item.id)).toEqual([
      "https://example.com/new",
      "https://example.com/old",
    ]);
    expect(result.state.entries[1]?.title).toBe("https://example.com/old");
  });

  it("does not change state when known entries are reordered or have new metadata", () => {
    const state = initializeState(
      "https://example.com/news",
      [entry("https://example.com/one"), entry("https://example.com/two")],
      10,
    );
    const result = mergeState(
      state,
      [
        entry("https://example.com/two", "changed"),
        entry("https://example.com/one", "changed"),
      ],
      10,
    );

    expect(result.newEntries).toEqual([]);
    expect(result.state).toBe(state);
  });
});
