/**
 * CLI scraper — run against your Postgres DB without starting the Next.js server.
 * Requires DATABASE_URL to be set (copy .env.example to .env.local).
 *
 * Usage:  npx tsx scripts/scrape-cli.ts [category]
 * Example: npx tsx scripts/scrape-cli.ts judgments
 */

import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { ScrapeJob, ScraperCategory } from "../types";
import { saveJob } from "../lib/storage";
import { runScrapeJob } from "../lib/scrapers";

// Load .env or .env.local for local runs
if (!process.env.DATABASE_URL) {
  for (const envFile of [".env.local", ".env"]) {
    try {
      const env = readFileSync(envFile, "utf-8");
      for (const line of env.split("\n")) {
        const [k, ...v] = line.split("=");
        if (k && !k.startsWith("#")) process.env[k.trim()] = v.join("=").trim();
      }
      break;
    } catch {
      // file not found — try next
    }
  }
}

const VALID: string[] = [
  "all", "judgments", "legislation",
  "practice-directions", "court-rules", "cause-list", "general",
];

const arg = process.argv[2] || "all";
const category: ScraperCategory | "all" = VALID.includes(arg)
  ? (arg as ScraperCategory | "all")
  : "all";

console.log(`\nStarting scrape: category="${category}"`);
console.log("Rate limit: 1 req/s — this will take a while for large sites.\n");

async function main() {
  const job: ScrapeJob = {
    id: randomUUID(),
    status: "pending",
    category,
    startedAt: null,
    completedAt: null,
    totalPages: 0,
    scrapedPages: 0,
    failedPages: 0,
    documents: [],
    errors: [],
  };

  await saveJob(job);
  await runScrapeJob(job);

  console.log(`\nDone! Scraped ${job.scrapedPages} pages, got ${job.documents.length} documents.`);
  if (job.errors.length) {
    console.log(`Errors (${job.errors.length}):`);
    job.errors.slice(0, 5).forEach((e) => console.log(" -", e));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
