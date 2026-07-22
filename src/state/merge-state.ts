import type { FeedEntry, FeedState } from "../types.js";

export function initializeState(
  sourceUrl: string,
  entries: FeedEntry[],
  initialItemLimit: number,
): FeedState {
  return {
    version: 1,
    sourceUrl,
    entries: entries.slice(0, initialItemLimit),
  };
}

export function mergeState(
  state: FeedState,
  discoveredEntries: FeedEntry[],
  maxFeedItems: number,
): { state: FeedState; newEntries: FeedEntry[] } {
  const knownIds = new Set(state.entries.map((entry) => entry.id));
  const newEntries = discoveredEntries.filter(
    (entry) => !knownIds.has(entry.id),
  );

  if (newEntries.length === 0) {
    return { state, newEntries };
  }

  return {
    state: {
      ...state,
      entries: [...newEntries, ...state.entries].slice(0, maxFeedItems),
    },
    newEntries,
  };
}
