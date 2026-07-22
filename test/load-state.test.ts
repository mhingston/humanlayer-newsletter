import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadState } from "../src/state/load-state.js";
import { writeStateAtomic } from "../src/state/write-state.js";
import type { FeedState } from "../src/types.js";

describe("state persistence", () => {
  it("loads a validated state fixture", async () => {
    const root = await mkdtemp(join(tmpdir(), "feeder-state-"));
    const path = join(root, "state.json");
    await writeFile(
      path,
      await readFile(new URL("./fixtures/state.json", import.meta.url), "utf8"),
      "utf8",
    );

    const state = await loadState(path);
    expect(state?.entries[0]?.id).toBe("https://example.com/first");
  });

  it("rejects malformed state and validates atomic writes", async () => {
    const root = await mkdtemp(join(tmpdir(), "feeder-state-"));
    const invalidPath = join(root, "invalid.json");
    await writeFile(invalidPath, '{"version": 2}', "utf8");
    await expect(loadState(invalidPath)).rejects.toThrow("expected schema");

    const state: FeedState = {
      version: 1,
      sourceUrl: "https://example.com/news",
      entries: [],
    };
    const path = join(root, "state.json");
    await writeStateAtomic(path, state);
    expect(await loadState(path)).toEqual(state);
    expect(await readFile(path, "utf8")).toMatch(/\n$/);
  });
});
