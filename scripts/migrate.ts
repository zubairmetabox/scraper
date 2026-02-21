/**
 * Run once to set up the database schema.
 * Usage: npx tsx scripts/migrate.ts
 */
import sql from "../lib/db";

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      url          TEXT NOT NULL UNIQUE,
      category     TEXT NOT NULL,
      content      TEXT NOT NULL,
      metadata     JSONB NOT NULL DEFAULT '{}',
      scraped_at   TIMESTAMPTZ NOT NULL,
      content_hash TEXT NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_documents_scraped_at ON documents(scraped_at DESC)
  `;

  // Full-text search index on title + content
  await sql`
    CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents
    USING GIN (to_tsvector('english', title || ' ' || content))
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id             TEXT PRIMARY KEY,
      status         TEXT NOT NULL DEFAULT 'pending',
      category       TEXT NOT NULL,
      started_at     TIMESTAMPTZ,
      completed_at   TIMESTAMPTZ,
      total_pages    INT NOT NULL DEFAULT 0,
      scraped_pages  INT NOT NULL DEFAULT 0,
      failed_pages   INT NOT NULL DEFAULT 0,
      document_count INT NOT NULL DEFAULT 0,
      errors         TEXT[] NOT NULL DEFAULT '{}'
    )
  `;

  console.log("Migrations complete.");
  await sql.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
