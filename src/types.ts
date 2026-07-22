export interface AppConfig {
  firecrawlApiKey: string;
  sourceUrl: string;
  feedTitle: string;
  feedDescription: string;
  publicBaseUrl: string;
  feedSiteUrl: string;
  feedLanguage?: string;
  feedAuthor?: string;
  feedCopyright?: string;
  atomFilename: string;
  rssFilename: string;
  maxFeedItems: number;
  initialItemLimit: number;
  extractionHint?: string;
  timeoutMs: number;
  maxAgeMs: number;
  onlyMainContent: boolean;
  proxy: string;
}

export interface ExtractedEntry {
  title: string;
  url: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  summary?: string | null;
  author?: string | null;
}

export interface ExtractedPage {
  entries: ExtractedEntry[];
}

export interface FeedEntry {
  id: string;
  url: string;
  title: string;
  publishedAt?: string;
  updatedAt?: string;
  firstSeenAt: string;
  summary?: string;
  author?: string;
}

export interface FeedState {
  version: 1;
  sourceUrl: string;
  entries: FeedEntry[];
}

export interface NormalizedExtraction {
  entries: FeedEntry[];
  returnedCount: number;
  rejectedCount: number;
}

export interface GeneratedOutputs {
  atom: string;
  rss: string;
  index: string;
  atomUrl: string;
  rssUrl: string;
}

export type UpdateResult =
  | {
      status: "updated";
      newEntries: number;
      totalEntries: number;
      returnedCount: number;
      acceptedCount: number;
      rejectedCount: number;
      outputs: GeneratedOutputs;
    }
  | {
      status: "unchanged";
      newEntries: 0;
      totalEntries: number;
      returnedCount: number;
      acceptedCount: number;
      rejectedCount: number;
    };
