import fs from "fs";
import path from "path";
import { ScrapedDocument, ScrapeJob } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_FILE = path.join(DATA_DIR, "documents.json");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function loadDocuments(): ScrapedDocument[] {
  ensureDir();
  if (!fs.existsSync(DOCS_FILE)) return [];
  return JSON.parse(fs.readFileSync(DOCS_FILE, "utf-8"));
}

export function saveDocuments(docs: ScrapedDocument[]) {
  ensureDir();
  fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2));
}

export function upsertDocument(doc: ScrapedDocument) {
  const docs = loadDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    docs[idx] = doc;
  } else {
    docs.push(doc);
  }
  saveDocuments(docs);
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export function loadJobs(): ScrapeJob[] {
  ensureDir();
  if (!fs.existsSync(JOBS_FILE)) return [];
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
}

export function saveJob(job: ScrapeJob) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.push(job);
  }
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export function getJob(id: string): ScrapeJob | null {
  return loadJobs().find((j) => j.id === id) ?? null;
}

export function exportAsNDJSON(): string {
  const docs = loadDocuments();
  return docs.map((d) => JSON.stringify(d)).join("\n");
}
