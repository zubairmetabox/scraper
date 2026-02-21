import { createHttpClient } from "@/lib/http-client";
import { parsePage, hashContent } from "@/lib/parser";
import { isAllowed, BASE_URL } from "./site-map";
import { upsertDocument } from "@/lib/storage";
import { ScrapedDocument, ScraperCategory, ScrapeJob } from "@/types";
import { saveJob } from "@/lib/storage";
import slugify from "slugify";
import { randomUUID } from "crypto";

interface CrawlOptions {
  startUrls: string[];
  category: ScraperCategory;
  maxDepth?: number;
  maxPages?: number;
  job: ScrapeJob;
  onProgress?: (job: ScrapeJob) => void;
}

export async function crawlSection(opts: CrawlOptions): Promise<ScrapedDocument[]> {
  const {
    startUrls,
    category,
    maxDepth = 3,
    maxPages = 500,
    job,
  } = opts;

  const client = createHttpClient();
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = startUrls.map((url) => ({
    url,
    depth: 0,
  }));
  const collected: ScrapedDocument[] = [];

  while (queue.length > 0 && collected.length < maxPages) {
    const { url, depth } = queue.shift()!;

    // Normalise URL (strip trailing slash, fragments)
    const normUrl = url.split("#")[0].replace(/\/$/, "");
    if (visited.has(normUrl) || !isAllowed(normUrl)) continue;
    if (!normUrl.startsWith(BASE_URL)) continue;

    visited.add(normUrl);
    job.scrapedPages++;

    try {
      const resp = await client.get(normUrl);
      if (!resp.headers["content-type"]?.includes("text/html")) continue;

      const { title, content, links, metadata } = parsePage(resp.data, normUrl);

      if (!content || content.length < 50) {
        // Skip near-empty pages (nav-only pages, redirects)
        continue;
      }

      const id = slugify(title || normUrl, { lower: true, strict: true }).slice(0, 80) +
        "-" + randomUUID().slice(0, 8);

      const doc: ScrapedDocument = {
        id,
        title: title || normUrl,
        url: normUrl,
        category,
        content,
        metadata,
        scrapedAt: new Date().toISOString(),
        contentHash: hashContent(content),
      };

      collected.push(doc);
      upsertDocument(doc);

      // Save job progress
      job.documents = collected;
      saveJob(job);

      // Enqueue child links
      if (depth < maxDepth) {
        for (const link of links) {
          const norm = link.split("#")[0].replace(/\/$/, "");
          if (!visited.has(norm) && isAllowed(norm)) {
            queue.push({ url: norm, depth: depth + 1 });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      job.errors.push(`Failed ${normUrl}: ${msg}`);
      job.failedPages++;
      saveJob(job);
    }
  }

  return collected;
}
