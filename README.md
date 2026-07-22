# humanlayer-newsletter

Atom and RSS feeds for [HumanLayer's blog](https://www.humanlayer.dev/blog), published through GitHub Pages.

This project monitors `https://www.humanlayer.dev/blog`, asks Firecrawl to identify each visible blog post as a structured entry, and rebuilds the feeds whenever a new post URL appears. Posts by Dex and Kyle on coding agents, context engineering, harness design, CLAUDE.md, the Ralph Wiggum technique, and other long-form pieces land in subscribers' feed readers automatically.

## How it works

1. Firecrawl extracts the entries from `SOURCE_URL` (the HumanLayer blog index) as structured JSON.
2. Invalid URLs and dates are rejected; valid URLs become stable entry IDs.
3. The IDs are compared with `data/state.json`.
4. If there are no new IDs, the state and feeds are left untouched.
5. If new IDs are found, the Atom feed, RSS feed, and index page are rebuilt and published to GitHub Pages.

The first successful run creates a useful initial feed containing up to `INITIAL_ITEM_LIMIT` entries (default 20, comfortably covering the most recent posts). Later runs add only previously unseen URLs; metadata changes to known URLs do not rewrite existing feed entries.

## Requirements

- Node.js 24
- A [Firecrawl](https://firecrawl.dev) account and API key
- A GitHub repository with GitHub Pages enabled through GitHub Actions

## Local setup

Install dependencies:

```bash
npm ci
```

Copy `.env.example` to `.env` and fill in the required values:

```dotenv
FIRECRAWL_API_KEY=fc-your-key-here
SOURCE_URL=https://www.humanlayer.dev/blog
FEED_TITLE=HumanLayer Blog
FEED_DESCRIPTION=Posts from humanlayer.dev/blog — coding agents, context engineering, and harness design by Dex & Kyle
PUBLIC_BASE_URL=https://mhingston.github.io/humanlayer-newsletter
```

`PUBLIC_BASE_URL` is the public GitHub Pages base URL without a trailing slash. `FEED_SITE_URL` is optional and should point to the source website; when omitted, it defaults to the source URL's origin (`https://www.humanlayer.dev`).

Run an update:

```bash
npm run update
```

The command exits successfully when feeds are updated or when there are no changes. Its final line is machine-readable JSON, for example:

```json
{ "status": "unchanged", "newEntries": 0, "totalEntries": 20 }
```

Never commit `.env` or an API key. `.env` is ignored by Git.

## GitHub Actions

Add `FIRECRAWL_API_KEY` as a repository secret.

Add these repository variables:

- `SOURCE_URL=https://www.humanlayer.dev/blog`
- `FEED_TITLE=HumanLayer Blog`
- `FEED_DESCRIPTION=Posts from humanlayer.dev/blog — coding agents, context engineering, and harness design by Dex & Kyle`
- `PUBLIC_BASE_URL=https://mhingston.github.io/humanlayer-newsletter`
- `FEED_SITE_URL=https://www.humanlayer.dev` (optional; defaults to source origin)

The optional settings in `.env.example` can also be supplied as repository variables; otherwise their defaults are used.

The feed update workflow runs daily at 06:17 UTC and can be started manually from **Actions → Update feed → Run workflow**. It uses workflow concurrency to prevent overlapping updates.

Pull requests and pushes to the default branch run the local formatting, lint, type-check, and test suite. CI never calls Firecrawl and does not receive repository secrets.

## GitHub Pages output

With the default filenames, the feeds are available at:

- `https://mhingston.github.io/humanlayer-newsletter/feed.atom.xml`
- `https://mhingston.github.io/humanlayer-newsletter/feed.rss.xml`

The generated index page links to both feeds and the source blog, and displays the retained entry count and generation timestamp.

Subscribers see new stories only after a successful update rebuilds the feeds and the Pages deployment completes. When no new IDs are found, the workflow does not rewrite the feeds, commit, or deploy. Normal HTTP and feed-reader caching may add a short delay.

## Firecrawl usage

Each update makes one Firecrawl `/scrape` request for the configured source URL. Actual credit usage depends on the Firecrawl plan, page complexity, rendering, proxy behavior, and current pricing. Check the Firecrawl dashboard for authoritative usage.

## Development checks

```bash
npm run check
npm run build
```

The normal test suite uses saved Firecrawl JSON fixtures and makes no live network requests. An optional live check is available with:

```bash
npm run test:integration
```

It runs only when both `FIRECRAWL_API_KEY` and `SOURCE_URL` are configured.

## Troubleshooting

- **Invalid configuration:** check that required variables are present and that `SOURCE_URL`, `FEED_SITE_URL`, and `PUBLIC_BASE_URL` are absolute HTTP(S) URLs.
- **No feed update:** `unchanged` means every accepted normalized URL is already retained in `data/state.json`.
- **Extraction failure:** the previous state and feeds are preserved; check the concise diagnostic and try again later.
- **Pages is stale:** confirm Pages uses GitHub Actions, the update workflow has a successful deployment, and `PUBLIC_BASE_URL` matches the Pages address.
- **Unexpected entries:** add a narrow `EXTRACTION_HINT`; it supplements the built-in extraction instructions.

## Limitations

The project supports one source URL per repository. It does not support site-specific selectors, custom parsers, browser automation, raw HTML parsing, full article fetching, pagination, infinite scroll, authenticated websites, metadata updates for known URLs, deletions, Monitor webhooks, search-based discovery, database storage, or server deployment.

Firecrawl extraction quality depends on the source page and service. Invalid URLs are rejected individually. A missing or invalid structured response, or an extraction with zero valid entries, rejects the run and preserves the last valid outputs. A listing page can only reveal entries that are visible when it is checked.

## Legal and ethical responsibility

This project republishes public post metadata from `humanlayer.dev/blog` for feed-reader convenience. It is not affiliated with, endorsed by, or operated by HumanLayer. You are responsible for respecting the source site's terms, robots directives, copyright, privacy, rate limits, and applicable law. Do not use this project to bypass access controls or collect personal data without a lawful basis. Firecrawl account usage and the content published through GitHub Pages remain your responsibility.

## Credits

Built on the [`feeder`](https://github.com/mhingston/feeder) template (MIT).
