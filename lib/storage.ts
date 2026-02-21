import sql from "./db";
import { ScrapedDocument, ScrapeJob } from "@/types";

// ─── Documents ────────────────────────────────────────────────────────────────

export async function upsertDocument(doc: ScrapedDocument) {
  await sql`
    INSERT INTO documents (id, title, url, category, content, metadata, scraped_at, content_hash)
    VALUES (
      ${doc.id}, ${doc.title}, ${doc.url}, ${doc.category},
      ${doc.content}, ${JSON.stringify(doc.metadata)},
      ${doc.scrapedAt}, ${doc.contentHash}
    )
    ON CONFLICT (url) DO UPDATE SET
      title        = EXCLUDED.title,
      content      = EXCLUDED.content,
      metadata     = EXCLUDED.metadata,
      scraped_at   = EXCLUDED.scraped_at,
      content_hash = EXCLUDED.content_hash
  `;
}

export async function queryDocuments(opts: {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; items: ScrapedDocument[] }> {
  const { category, q, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  // Build dynamic WHERE clauses
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (category) {
    conditions.push(`category = $${i++}`);
    values.push(category);
  }

  if (q) {
    conditions.push(
      `to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $${i++})`
    );
    values.push(q);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRow] = await sql.unsafe(
    `SELECT COUNT(*) FROM documents ${where}`,
    values as string[]
  );
  const total = parseInt(countRow.count, 10);

  const rows = await sql.unsafe(
    `SELECT * FROM documents ${where} ORDER BY scraped_at DESC LIMIT $${i++} OFFSET $${i}`,
    [...values, limit, offset] as string[]
  );

  return {
    total,
    items: rows.map(rowToDoc),
  };
}

export async function loadAllDocuments(category?: string): Promise<ScrapedDocument[]> {
  const rows = category
    ? await sql`SELECT * FROM documents WHERE category = ${category} ORDER BY scraped_at DESC`
    : await sql`SELECT * FROM documents ORDER BY scraped_at DESC`;
  return rows.map(rowToDoc);
}

function rowToDoc(row: Record<string, unknown>): ScrapedDocument {
  return {
    id: row.id as string,
    title: row.title as string,
    url: row.url as string,
    category: row.category as ScrapedDocument["category"],
    content: row.content as string,
    metadata: (row.metadata as Record<string, string>) ?? {},
    scrapedAt: String(row.scraped_at),
    contentHash: row.content_hash as string,
  };
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function saveJob(job: ScrapeJob) {
  await sql`
    INSERT INTO jobs (
      id, status, category, started_at, completed_at,
      total_pages, scraped_pages, failed_pages, document_count, errors
    ) VALUES (
      ${job.id}, ${job.status}, ${job.category},
      ${job.startedAt ?? null}, ${job.completedAt ?? null},
      ${job.totalPages}, ${job.scrapedPages}, ${job.failedPages},
      ${job.documents.length}, ${job.errors}
    )
    ON CONFLICT (id) DO UPDATE SET
      status         = EXCLUDED.status,
      started_at     = EXCLUDED.started_at,
      completed_at   = EXCLUDED.completed_at,
      total_pages    = EXCLUDED.total_pages,
      scraped_pages  = EXCLUDED.scraped_pages,
      failed_pages   = EXCLUDED.failed_pages,
      document_count = EXCLUDED.document_count,
      errors         = EXCLUDED.errors
  `;
}

export async function getJob(id: string): Promise<ScrapeJob | null> {
  const [row] = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (!row) return null;
  return rowToJob(row);
}

export async function listJobs(): Promise<ScrapeJob[]> {
  const rows =
    await sql`SELECT * FROM jobs ORDER BY started_at DESC NULLS LAST LIMIT 50`;
  return rows.map(rowToJob);
}

function rowToJob(row: Record<string, unknown>): ScrapeJob {
  return {
    id: row.id as string,
    status: row.status as ScrapeJob["status"],
    category: row.category as ScrapeJob["category"],
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    totalPages: Number(row.total_pages),
    scrapedPages: Number(row.scraped_pages),
    failedPages: Number(row.failed_pages),
    documents: [], // stored separately in documents table
    errors: (row.errors as string[]) ?? [],
  };
}
