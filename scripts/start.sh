#!/bin/sh
echo "Running database migrations..."
node -e "
const sql = require('./node_modules/postgres')
const db = sql(process.env.DATABASE_URL, { ssl: 'require', max: 1, connect_timeout: 10 })

async function migrate() {
  await db\`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, content TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}',
    scraped_at TIMESTAMPTZ NOT NULL, content_hash TEXT NOT NULL
  )\`
  await db\`CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)\`
  await db\`CREATE INDEX IF NOT EXISTS idx_documents_scraped_at ON documents(scraped_at DESC)\`
  await db\`CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN (to_tsvector('english', title || ' ' || content))\`
  await db\`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'pending', category TEXT NOT NULL,
    started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
    total_pages INT NOT NULL DEFAULT 0, scraped_pages INT NOT NULL DEFAULT 0,
    failed_pages INT NOT NULL DEFAULT 0, document_count INT NOT NULL DEFAULT 0,
    errors TEXT[] NOT NULL DEFAULT '{}'
  )\`
  await db.end()
  console.log('Migrations complete.')
}
migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1) })
"
echo "Starting server..."
exec node server.js
