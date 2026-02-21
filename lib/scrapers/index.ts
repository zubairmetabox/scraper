import { SITE_SECTIONS, BASE_URL } from "./site-map";
import { crawlSection } from "./crawler";
import { ScrapeJob, ScraperCategory, ScrapedDocument } from "@/types";
import { saveJob } from "@/lib/storage";

export async function runScrapeJob(job: ScrapeJob): Promise<void> {
  job.status = "running";
  job.startedAt = new Date().toISOString();
  saveJob(job);

  try {
    // Determine which sections to scrape
    const sections =
      job.category === "all"
        ? SITE_SECTIONS
        : SITE_SECTIONS.filter((s) => s.category === job.category);

    // Also always crawl the homepage to discover additional links
    const startUrls =
      job.category === "all"
        ? [BASE_URL, ...sections.map((s) => s.url)]
        : sections.map((s) => s.url);

    const allDocs: ScrapedDocument[] = [];

    for (const section of sections) {
      const docs = await crawlSection({
        startUrls: [section.url],
        category: section.category as ScraperCategory,
        maxDepth: 4,
        maxPages: 200,
        job,
      });
      allDocs.push(...docs);
    }

    // If scraping all, also do a homepage crawl to catch unlisted pages
    if (job.category === "all") {
      const discovered = await crawlSection({
        startUrls: [BASE_URL],
        category: "general",
        maxDepth: 2,
        maxPages: 100,
        job,
      });
      allDocs.push(...discovered);
    }

    job.status = "completed";
    job.completedAt = new Date().toISOString();
    job.documents = allDocs;
    job.totalPages = allDocs.length;
  } catch (err: unknown) {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.errors.push(err instanceof Error ? err.message : String(err));
  }

  saveJob(job);
}

export { SITE_SECTIONS };
