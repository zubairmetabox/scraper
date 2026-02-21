# GovMU Legal Scraper

A Next.js app that scrapes public legal data from the [Supreme Court of Mauritius](https://supremecourt.govmu.org/) for use in the GovMU legal chatbot.

> **Authorization**: This scraper is built for and with the Government of Mauritius. It only accesses public pages and respects the site's `robots.txt` (no admin/user/search paths are crawled).

---

## Prerequisites

- Node.js 18+
- A **Postgres** database — [Supabase](https://supabase.com) (free) or [Neon](https://neon.tech) (free) both work

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your DATABASE_URL
cp .env.example .env.local

# 3. Run the DB migration (creates tables)
npx tsx scripts/migrate.ts

# 4. Start the dev server
npm run dev   # → http://localhost:3000
```

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set the environment variable in Vercel dashboard or CLI:
vercel env add DATABASE_URL
# → paste your Postgres connection string

# Re-deploy with the env var
vercel --prod
```

Vercel settings are in `vercel.json`. The scrape API route has a 300s timeout (requires **Vercel Pro**; hobby plan is capped at 60s).

---

## Usage

### Web Dashboard
Open `http://localhost:3000` (or your Vercel URL) to:
- Select a category (Judgments, Legislation, etc.) or scrape all
- Monitor progress in real-time
- Export data as JSON or NDJSON

### CLI (runs against the same Postgres DB)
```bash
npm run scrape                      # scrape everything
npm run scrape -- judgments
npm run scrape -- legislation
npm run scrape -- practice-directions
npm run scrape -- court-rules
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scrape` | Start a job `{ "category": "all" \| "judgments" \| ... }` |
| `GET`  | `/api/scrape` | List all jobs |
| `GET`  | `/api/jobs/:id` | Poll job status |
| `GET`  | `/api/documents` | Search docs `?category=&q=&page=&limit=` |
| `GET`  | `/api/export` | Download `?format=json\|ndjson&category=` |

---

## Output Format

```json
{
  "id": "judgment-vs-republic-2024-a1b2c3d4",
  "title": "Judgment: X vs Republic [2024]",
  "url": "https://supremecourt.govmu.org/judgments/...",
  "category": "judgments",
  "content": "Full extracted text...",
  "metadata": { "Date": "2024-01-15", "Judge": "..." },
  "scrapedAt": "2024-02-21T10:00:00Z",
  "contentHash": "abc123def456"
}
```

---

## Responsible Scraping

- Rate limited to **1 request per second**
- Identifies itself with a descriptive `User-Agent`
- Respects all `robots.txt` disallow rules
- Auto-retries on `429 Too Many Requests` with server-specified delay
- Deduplicates by URL (`ON CONFLICT (url) DO UPDATE`)
