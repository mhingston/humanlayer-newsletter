import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { loadConfig, loadEnvironment } from "./config.js";
import { createFirecrawlClient } from "./extraction/firecrawl-client.js";
import { extractEntries } from "./extraction/extract-entries.js";
import { generateFeeds } from "./feed/generate-feed.js";
import { loadState } from "./state/load-state.js";
import { initializeState, mergeState } from "./state/merge-state.js";
import { writeStateAndOutputsAtomic } from "./state/write-state.js";
import type { AppConfig, UpdateResult } from "./types.js";
import type { FirecrawlClientLike } from "./extraction/firecrawl-client.js";
import type { OutputPaths } from "./state/write-state.js";

export function defaultPaths(
  root = process.cwd(),
  atomFilename = "feed.atom.xml",
  rssFilename = "feed.rss.xml",
): OutputPaths {
  return {
    statePath: join(root, "data", "state.json"),
    atomPath: join(root, "public", atomFilename),
    rssPath: join(root, "public", rssFilename),
    indexPath: join(root, "public", "index.html"),
  };
}

export async function runUpdate(
  config: AppConfig,
  client: FirecrawlClientLike,
  paths?: OutputPaths,
  now = new Date(),
): Promise<UpdateResult> {
  const outputPaths =
    paths ??
    defaultPaths(process.cwd(), config.atomFilename, config.rssFilename);
  const existingState = await loadState(outputPaths.statePath);
  if (existingState && existingState.sourceUrl !== config.sourceUrl) {
    throw new Error("State source URL does not match SOURCE_URL");
  }

  const runTimestamp = now.toISOString();
  const extraction = await extractEntries(client, config, runTimestamp, now);

  if (!existingState) {
    const state = initializeState(
      config.sourceUrl,
      extraction.entries,
      config.initialItemLimit,
    );
    const outputs = generateFeeds(config, state);
    await writeStateAndOutputsAtomic(outputPaths, state, outputs);
    return {
      status: "updated",
      newEntries: state.entries.length,
      totalEntries: state.entries.length,
      returnedCount: extraction.returnedCount,
      acceptedCount: extraction.entries.length,
      rejectedCount: extraction.rejectedCount,
      outputs,
    };
  }

  const merged = mergeState(
    existingState,
    extraction.entries,
    config.maxFeedItems,
  );
  if (merged.newEntries.length === 0) {
    return {
      status: "unchanged",
      newEntries: 0,
      totalEntries: existingState.entries.length,
      returnedCount: extraction.returnedCount,
      acceptedCount: extraction.entries.length,
      rejectedCount: extraction.rejectedCount,
    };
  }

  const outputs = generateFeeds(config, merged.state);
  await writeStateAndOutputsAtomic(outputPaths, merged.state, outputs);
  return {
    status: "updated",
    newEntries: merged.newEntries.length,
    totalEntries: merged.state.entries.length,
    returnedCount: extraction.returnedCount,
    acceptedCount: extraction.entries.length,
    rejectedCount: extraction.rejectedCount,
    outputs,
  };
}

async function main(): Promise<number> {
  let config: AppConfig | undefined;
  try {
    loadEnvironment();
    config = loadConfig(process.env);
    console.log("Configuration valid");

    const result = await runUpdate(config, createFirecrawlClient(config));
    console.log(
      `Firecrawl extraction completed: ${result.returnedCount} entries returned`,
    );
    console.log(`Entries accepted: ${result.acceptedCount}`);
    console.log(`Entries rejected: ${result.rejectedCount}`);
    console.log(`New entries: ${result.newEntries}`);
    console.log(`Feed entries retained: ${result.totalEntries}`);
    console.log(
      result.status === "updated"
        ? "State and feeds updated"
        : "No new entries; state and feeds unchanged",
    );
    await writeGithubSummary(config, result);
    console.log(
      JSON.stringify({
        status: result.status,
        newEntries: result.newEntries,
        totalEntries: result.totalEntries,
      }),
    );
    return 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown update failure";
    console.error(`Update failed: ${message}`);
    await writeGithubSummary(config, undefined, message);
    console.log(
      JSON.stringify({ status: "failed", newEntries: 0, totalEntries: 0 }),
    );
    return 1;
  }
}

async function writeGithubSummary(
  config: AppConfig | undefined,
  result?: UpdateResult,
  error?: string,
): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  const lines = [
    "## humanlayer-newsletter update",
    "",
    ...(config ? [`- Source URL: ${config.sourceUrl}`] : []),
    `- Extraction result: ${error ? "failed" : (result?.status ?? "unknown")}`,
  ];

  if (result) {
    lines.push(
      `- Entries returned: ${result.returnedCount}`,
      `- Entries valid: ${result.acceptedCount}`,
      `- New entries: ${result.newEntries}`,
      `- Output status: ${result.status}`,
    );
    const atomUrl =
      result.status === "updated"
        ? result.outputs.atomUrl
        : config
          ? `${config.publicBaseUrl}/${config.atomFilename}`
          : undefined;
    const rssUrl =
      result.status === "updated"
        ? result.outputs.rssUrl
        : config
          ? `${config.publicBaseUrl}/${config.rssFilename}`
          : undefined;
    if (atomUrl && rssUrl) {
      lines.push(`- Atom feed: ${atomUrl}`, `- RSS feed: ${rssUrl}`);
    }
  } else if (error) {
    lines.push(`- Diagnostic: ${error}`);
  }

  await appendFile(summaryPath, `${lines.join("\n")}\n`, "utf8");
}

const isMainModule =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMainModule) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
