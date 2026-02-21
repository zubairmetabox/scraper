import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ScrapeJob, ScraperCategory } from "@/types";
import { saveJob, loadJobs } from "@/lib/storage";
import { runScrapeJob } from "@/lib/scrapers";

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
  const jobs = loadJobs();
  return NextResponse.json({ jobs });
}

// POST /api/scrape  — start a new scrape job
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

  saveJob(job);

  // Run in background (don't await — return immediately with job ID)
  runScrapeJob(job).catch((err) => {
    console.error("Scrape job failed:", err);
  });

  return NextResponse.json({ jobId: job.id, status: "pending" }, { status: 202 });
}
