# humanlayer-newsletter — coding agent guidance

This project publishes Atom and RSS feeds for the HumanLayer blog
(`https://www.humanlayer.dev/blog`) on a daily GitHub Actions schedule. It is a
single-source, Firecrawl-driven feed generator forked conceptually from
[`mhingston/feeder`](https://github.com/mhingston/feeder); the project boundaries
and behavioral invariants below preserve that lineage.

## Project boundaries

- Do not add Playwright, Puppeteer, browser automation, HTML selectors, CSS selectors, Cheerio, or site-specific parsing.
- Do not parse raw webpage HTML or Markdown; preserve Firecrawl JSON-mode extraction as the extraction boundary.
- Keep the project single-source for v1.
- Avoid abstractions that are only needed by a hypothetical multi-source version.

## Behavioral invariants

- Do not make live Firecrawl requests in normal tests; use fixtures and injected clients.
- Maintain deterministic feed and index output for the same state.
- Never rewrite state or feeds when no new normalized IDs exist.
- Never replace valid state or published feeds after an extraction, validation, or feed-generation failure.
- Preserve first-seen timestamps for known URLs and do not update known metadata in v1.
- Keep URL normalization limited to the documented canonicalization rules.
- Treat `data/state.json` and `public/` as generated deployment artifacts; do not commit local smoke-test output unless publishing that baseline is intentional.

## Completion checklist

- Update tests whenever normalization or state semantics change.
- Run `npm run check` before completing work.
- Keep secrets out of logs, fixtures, summaries, and committed files.
