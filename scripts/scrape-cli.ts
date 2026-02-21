/**
 * CLI scraper — run without starting the Next.js server.
 * Usage:  npx tsx scripts/scrape-cli.ts [category]
 * Example: npx tsx scripts/scrape-cli.ts judgments
 */

import { randomUUID } from "crypto";
import { ScrapeJob, ScraperCategory } from "../types";
import { saveJob } from "../lib/storage";
import { runScrapeJob } from "../lib/scrapers";

const VALID: string[] = [
  "all",
  "judgments",
  "legislation",
  "practice-directions",
  "court-rules",
  "cause-list",
  "general",
];

const arg = process.argv[2] || "all";
const category: ScraperCategory | "all" = VALID.includes(arg)
  ? (arg as ScraperCategory | "all")
  : "all";

console.log(`\nStarting scrape: category="${category}"`);
console.log("Rate limit: 1 req/s — this will take a while for large sites.\n");

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

saveJob(job);

runScrapeJob(job)
  .then(() => {
    const updated = { ...job };
    console.log(`\nDone! Scraped ${job.scrapedPages} pages, got ${job.documents.length} documents.`);
    if (job.errors.length) {
      console.log(`Errors (${job.errors.length}):`);
      job.errors.slice(0, 5).forEach((e) => console.log(" -", e));
    }
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
