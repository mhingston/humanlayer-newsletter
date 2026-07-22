import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { FeedStateSchema } from "./load-state.js";
import type { FeedState, GeneratedOutputs } from "../types.js";

export interface OutputPaths {
  statePath: string;
  atomPath: string;
  rssPath: string;
  indexPath: string;
}

export async function writeStateAtomic(
  path: string,
  state: FeedState,
): Promise<void> {
  await writeFilesAtomically([
    { path, content: serializeState(state), validateState: true },
  ]);
}

export async function writeStateAndOutputsAtomic(
  paths: OutputPaths,
  state: FeedState,
  outputs: GeneratedOutputs,
): Promise<void> {
  await writeFilesAtomically([
    { path: paths.atomPath, content: outputs.atom },
    { path: paths.rssPath, content: outputs.rss },
    { path: paths.indexPath, content: outputs.index },
    {
      path: paths.statePath,
      content: serializeState(state),
      validateState: true,
    },
  ]);
}

function serializeState(state: FeedState): string {
  FeedStateSchema.parse(state);
  return `${JSON.stringify(state, null, 2)}\n`;
}

async function writeFilesAtomically(
  files: Array<{ path: string; content: string; validateState?: boolean }>,
): Promise<void> {
  const temporaryFiles: Array<{ path: string; temporaryPath: string }> = [];

  try {
    for (const file of files) {
      await mkdir(dirname(file.path), { recursive: true });
      const temporaryPath = join(
        dirname(file.path),
        `.${basename(file.path)}.${process.pid}.${Date.now()}.${temporaryFiles.length}.tmp`,
      );
      await writeFile(temporaryPath, file.content, "utf8");
      if (file.validateState) {
        const validated = JSON.parse(
          await readFile(temporaryPath, "utf8"),
        ) as unknown;
        FeedStateSchema.parse(validated);
      }
      temporaryFiles.push({ path: file.path, temporaryPath });
    }

    for (const file of temporaryFiles) {
      await rename(file.temporaryPath, file.path);
    }
  } finally {
    await Promise.all(
      temporaryFiles.map(async ({ temporaryPath }) => {
        await rm(temporaryPath, { force: true }).catch(() => undefined);
      }),
    );
  }
}
