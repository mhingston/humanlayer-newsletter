import { readFile, stat } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultPaths, runUpdate } from "../src/cli.js";
import { loadState } from "../src/state/load-state.js";
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
  maxFeedItems: 2,
  initialItemLimit: 2,
  timeoutMs: 120_000,
  maxAgeMs: 0,
  onlyMainContent: true,
  proxy: "auto",
};

function page(entries: Array<{ title: string; url: string }>): unknown {
  return { json: { entries } };
}

describe("runUpdate", () => {
  it("initializes, stays unchanged for known URLs, then adds one new URL", async () => {
    const root = await mkdtemp(join(tmpdir(), "feeder-update-"));
    const paths = defaultPaths(root);
    let response = page([
      { title: "Old", url: "/old" },
      { title: "Older", url: "/older" },
      { title: "Ignored by initial limit", url: "/ignored" },
    ]);
    const client = { scrape: async () => response };

    const initial = await runUpdate(
      config,
      client,
      paths,
      new Date("2026-07-14T09:00:00.000Z"),
    );
    expect(initial.status).toBe("updated");
    expect(initial.newEntries).toBe(2);
    expect((await loadState(paths.statePath))?.entries).toHaveLength(2);

    const atomBefore = await readFile(paths.atomPath, "utf8");
    const rssBefore = await readFile(paths.rssPath, "utf8");
    const indexBefore = await readFile(paths.indexPath, "utf8");
    const stateBefore = await stat(paths.statePath);
    response = page([
      { title: "Old", url: "/old" },
      { title: "Older", url: "/older" },
    ]);
    const unchanged = await runUpdate(
      config,
      client,
      paths,
      new Date("2026-07-14T10:00:00.000Z"),
    );
    expect(unchanged).toMatchObject({
      status: "unchanged",
      newEntries: 0,
      totalEntries: 2,
    });
    expect(await readFile(paths.atomPath, "utf8")).toBe(atomBefore);
    expect(await readFile(paths.rssPath, "utf8")).toBe(rssBefore);
    expect(await readFile(paths.indexPath, "utf8")).toBe(indexBefore);
    const stateAfter = await stat(paths.statePath);
    expect(stateAfter.ino).toBe(stateBefore.ino);
    expect(stateAfter.mtimeMs).toBe(stateBefore.mtimeMs);

    response = page([
      { title: "New", url: "/new" },
      { title: "Old metadata changed", url: "/old" },
    ]);
    const updated = await runUpdate(
      config,
      client,
      paths,
      new Date("2026-07-14T11:00:00.000Z"),
    );
    expect(updated).toMatchObject({
      status: "updated",
      newEntries: 1,
      totalEntries: 2,
    });
    expect(
      (await loadState(paths.statePath))?.entries.map((entry) => entry.id),
    ).toEqual(["https://example.com/new", "https://example.com/old"]);
  });

  it("preserves the last valid state and feeds after extraction failure", async () => {
    const root = await mkdtemp(join(tmpdir(), "feeder-update-"));
    const paths = defaultPaths(root);
    const goodClient = {
      scrape: async () => page([{ title: "Good", url: "/good" }]),
    };
    await runUpdate(
      config,
      goodClient,
      paths,
      new Date("2026-07-14T09:00:00.000Z"),
    );
    const stateBefore = await readFile(paths.statePath, "utf8");
    const atomBefore = await readFile(paths.atomPath, "utf8");

    await expect(
      runUpdate(
        config,
        {
          scrape: async () => {
            throw new Error("Firecrawl outage");
          },
        },
        paths,
        new Date("2026-07-14T10:00:00.000Z"),
      ),
    ).rejects.toThrow("Firecrawl API or extraction request failed");
    expect(await readFile(paths.statePath, "utf8")).toBe(stateBefore);
    expect(await readFile(paths.atomPath, "utf8")).toBe(atomBefore);
  });
});
