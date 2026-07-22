import { Feed } from "feed";
import type {
  AppConfig,
  FeedEntry,
  FeedState,
  GeneratedOutputs,
} from "../types.js";

export function generateFeeds(
  config: AppConfig,
  state: FeedState,
): GeneratedOutputs {
  const atomUrl = `${config.publicBaseUrl}/${config.atomFilename}`;
  const rssUrl = `${config.publicBaseUrl}/${config.rssFilename}`;
  const sortedEntries = sortEntries(state.entries);
  const updated =
    sortedEntries.length > 0
      ? effectiveFeedDate(sortedEntries[0]!)
      : new Date(0);

  const feed = new Feed({
    id: state.sourceUrl,
    link: config.feedSiteUrl,
    title: config.feedTitle,
    description: config.feedDescription,
    updated,
    feedLinks: {
      atom: atomUrl,
      rss: rssUrl,
    },
    ...(config.feedLanguage ? { language: config.feedLanguage } : {}),
    ...(config.feedAuthor ? { author: { name: config.feedAuthor } } : {}),
    ...(config.feedCopyright ? { copyright: config.feedCopyright } : {}),
  });

  for (const entry of sortedEntries) {
    const date = effectiveFeedDate(entry);
    feed.addItem({
      id: entry.id,
      link: entry.url,
      title: entry.title,
      date,
      ...(entry.publishedAt ? { published: new Date(entry.publishedAt) } : {}),
      ...(entry.summary
        ? { description: entry.summary, content: entry.summary }
        : {}),
      ...(entry.author ? { author: [{ name: entry.author }] } : {}),
    });
  }

  const atom = feed.atom1();
  const rss = feed.rss2();
  assertValidXml(atom, "Atom");
  assertValidXml(rss, "RSS");

  return {
    atom,
    rss,
    index: generateIndex(config, state, atomUrl, rssUrl, updated),
    atomUrl,
    rssUrl,
  };
}

export function effectiveFeedDate(entry: FeedEntry): Date {
  const value = entry.publishedAt ?? entry.updatedAt ?? entry.firstSeenAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid feed date for ${entry.id}`);
  }
  return date;
}

function sortEntries(entries: FeedEntry[]): FeedEntry[] {
  return [...entries].sort((left, right) => {
    const dateDifference =
      effectiveFeedDate(right).getTime() - effectiveFeedDate(left).getTime();
    return dateDifference || left.url.localeCompare(right.url);
  });
}

function generateIndex(
  config: AppConfig,
  state: FeedState,
  atomUrl: string,
  rssUrl: string,
  updated: Date,
): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(config.feedTitle)}</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(config.feedTitle)}</h1>
      <p>${escapeHtml(config.feedDescription)}</p>
      <p><a href="${escapeAttribute(state.sourceUrl)}">Source page</a></p>
      <ul>
        <li><a href="${escapeAttribute(atomUrl)}">Atom feed</a></li>
        <li><a href="${escapeAttribute(rssUrl)}">RSS feed</a></li>
      </ul>
      <p>Generated: <time datetime="${updated.toISOString()}">${updated.toISOString()}</time></p>
      <p>Retained entries: ${state.entries.length}</p>
    </main>
  </body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function assertValidXml(xml: string, format: string): void {
  if (
    !xml.startsWith("<?xml") ||
    (format === "Atom" &&
      (!xml.includes("<feed") || !xml.includes("</feed>"))) ||
    (format === "RSS" && (!xml.includes("<rss") || !xml.includes("</rss>")))
  ) {
    throw new Error(`${format} feed generation produced invalid XML`);
  }
}
