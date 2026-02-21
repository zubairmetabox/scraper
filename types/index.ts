export type ScraperCategory =
  | "judgments"
  | "legislation"
  | "practice-directions"
  | "court-rules"
  | "cause-list"
  | "general";

export interface ScrapedDocument {
  id: string;
  title: string;
  url: string;
  category: ScraperCategory;
  content: string;
  metadata: Record<string, string>;
  scrapedAt: string;
  contentHash: string;
}

export interface ScrapeJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  category: ScraperCategory | "all";
  startedAt: string | null;
  completedAt: string | null;
  totalPages: number;
  scrapedPages: number;
  failedPages: number;
  documents: ScrapedDocument[];
  errors: string[];
}

export interface SiteSection {
  name: string;
  url: string;
  category: ScraperCategory;
}
