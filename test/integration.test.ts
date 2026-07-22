import { loadConfig, loadEnvironment } from "../src/config.js";
import { createFirecrawlClient } from "../src/extraction/firecrawl-client.js";
import { extractEntries } from "../src/extraction/extract-entries.js";

loadEnvironment();

if (!process.env.FIRECRAWL_API_KEY || !process.env.SOURCE_URL) {
  console.log(
    "Integration test skipped: FIRECRAWL_API_KEY and SOURCE_URL are required",
  );
} else {
  const config = loadConfig(process.env);
  const now = new Date();
  const result = await extractEntries(
    createFirecrawlClient(config),
    config,
    now.toISOString(),
    now,
  );
  console.log(
    JSON.stringify({
      returned: result.returnedCount,
      accepted: result.entries.length,
      rejected: result.rejectedCount,
    }),
  );
}
