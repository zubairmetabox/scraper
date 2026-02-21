import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ScrapeJob, ScraperCategory } from "@/types";
import { saveJob, listJobs } from "@/lib/storage";
import { runScrapeJob } from "@/lib/scrapers";

// Vercel: allow up to 300s for Pro plans (scraping can take a while)
export const maxDuration = 300;

const VALID_CATEGORIES: Array<ScraperCategory | "all"> = [
  "all",
  "judgments",
  "legislation",
  "practice-directions",
  "court-rules",
  "cause-list",
  "general",
];

// GET  /api/scrape  — list all jobs
export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json({ jobs });
}

// POST /api/scrape  — start a new scrape job
// On Vercel, we run scraping synchronously within the request (no persistent
// background threads). The client polls /api/jobs/:id for live progress.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category: ScraperCategory | "all" = VALID_CATEGORIES.includes(body.category)
    ? body.category
    : "all";

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

  // Run scraping — this is synchronous on Vercel (function stays alive until done).
  // The dashboard polls /api/jobs/:id to show progress while this runs.
  await runScrapeJob(job);

  return NextResponse.json(
    { jobId: job.id, status: job.status },
    { status: 200 }
  );
}
