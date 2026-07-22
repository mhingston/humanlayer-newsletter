const STANDARD_EXTRACTION_PROMPT = `Extract the distinct content entries presented on this page.

An entry is an item a user would reasonably expect to appear in a feed, such
as an article, announcement, release, job posting, product update, event or
other newly published item.

Return entries in the order displayed on the page.

For each entry:
- return its title;
- return the URL linked to that specific entry;
- return the publication and update dates exactly as represented by the page;
- return the visible summary or description when available;
- return the visible author when available.

Exclude:
- page navigation;
- category and tag links;
- pagination;
- login or account links;
- footer links;
- advertisements;
- newsletter forms;
- social links;
- promotional links that are not content entries.

Do not invent missing dates, summaries or authors.
Do not summarize content that is not visibly represented on the listing page.`;

export function buildExtractionPrompt(hint?: string): string {
  const context = hint?.trim();
  return context
    ? `${STANDARD_EXTRACTION_PROMPT}\n\nAdditional source context:\n${context}`
    : STANDARD_EXTRACTION_PROMPT;
}
