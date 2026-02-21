# GovMU Legal Scraper

A Next.js app that scrapes public legal data from the [Supreme Court of Mauritius](https://supremecourt.govmu.org/) for use in the GovMU legal chatbot.

> **Authorization**: This scraper is built for and with the Government of Mauritius. It only accesses public pages and respects the site's `robots.txt` (no admin/user/search paths are crawled).

## Setup

```bash
npm install
npm run dev        # Dashboard at http://localhost:3000
```

## Usage

### Web Dashboard
Open `http://localhost:3000` to:
- Select a category (Judgments, Legislation, etc.) or scrape all sections
- Monitor scrape jobs in real-time
- Export data as JSON or NDJSON

### CLI (no server needed)
```bash
# Scrape everything
npm run scrape

# Scrape a specific category
npm run scrape -- judgments
npm run scrape -- legislation
npm run scrape -- practice-directions
npm run scrape -- court-rules
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scrape` | Start a new job `{ category: "all" \| "judgments" \| ... }` |
| `GET`  | `/api/scrape` | List all jobs |
| `GET`  | `/api/jobs/:id` | Poll job status |
| `GET`  | `/api/documents` | Query scraped docs `?category=&q=&page=&limit=` |
| `GET`  | `/api/export` | Download data `?format=json\|ndjson&category=` |

## Output Format

Each scraped document:
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

## Responsible Scraping

- Rate limited to **1 request per second**
- Respects all `robots.txt` disallow rules
- Identifies itself with a descriptive `User-Agent`
- Retries on `429 Too Many Requests` with server-specified delay
