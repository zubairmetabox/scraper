"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrapeJob, ScraperCategory } from "@/types";

type JobSummary = Omit<ScrapeJob, "documents"> & { documentCount: number };
type Category = ScraperCategory | "all";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All Sections" },
  { value: "judgments", label: "Judgments" },
  { value: "legislation", label: "Legislation" },
  { value: "practice-directions", label: "Practice Directions" },
  { value: "court-rules", label: "Court Rules" },
  { value: "cause-list", label: "Cause List" },
  { value: "general", label: "General Info" },
];

export default function Dashboard() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [activeJob, setActiveJob] = useState<JobSummary | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [loading, setLoading] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [polling, setPolling] = useState<string | null>(null);

  // Fetch all jobs on mount
  useEffect(() => {
    fetch("/api/scrape")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []));

    fetch("/api/documents?limit=1")
      .then((r) => r.json())
      .then((d) => setDocCount(d.total || 0));
  }, []);

  // Poll active job
  const pollJob = useCallback((jobId: string) => {
    setPolling(jobId);
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data: JobSummary = await res.json();
      setActiveJob(data);

      if (data.status === "completed" || data.status === "failed") {
        clearInterval(interval);
        setPolling(null);
        setLoading(false);
        setDocCount(data.documentCount);
        // Refresh job list
        fetch("/api/scrape")
          .then((r) => r.json())
          .then((d) => setJobs(d.jobs || []));
      }
    }, 2000);
  }, []);

  async function startScrape() {
    setLoading(true);
    setActiveJob(null);
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    const { jobId } = await res.json();
    pollJob(jobId);
  }

  const statusColor = (s: string) => {
    if (s === "completed") return "#22c55e";
    if (s === "failed") return "#ef4444";
    if (s === "running") return "#3b82f6";
    return "#94a3b8";
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
          Supreme Court of Mauritius
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
          Legal Data Scraper — authorized data extraction for the GovMU chatbot
        </p>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Documents scraped", value: docCount },
          { label: "Jobs run", value: jobs.length },
          {
            label: "Last job status",
            value: jobs[0]?.status ?? "none",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontWeight: 600, marginBottom: "1rem" }}>Start a Scrape Job</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              background: "#f8fafc",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={startScrape}
            disabled={loading}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: 8,
              background: loading ? "#94a3b8" : "#1d4ed8",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {loading ? "Running..." : "Start Scrape"}
          </button>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a
              href="/api/export?format=json"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border: "1px solid #1d4ed8",
                color: "#1d4ed8",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Export JSON
            </a>
            <a
              href="/api/export?format=ndjson"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border: "1px solid #1d4ed8",
                color: "#1d4ed8",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Export NDJSON
            </a>
          </div>
        </div>
      </div>

      {/* Active job progress */}
      {activeJob && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 600 }}>Current Job</h2>
            <span
              style={{
                background: statusColor(activeJob.status),
                color: "#fff",
                padding: "0.25rem 0.75rem",
                borderRadius: 99,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {activeJob.status}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {[
              { label: "Category", value: activeJob.category },
              { label: "Pages scraped", value: activeJob.scrapedPages },
              { label: "Documents", value: activeJob.documentCount },
              { label: "Errors", value: activeJob.failedPages },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{item.label}</div>
                <div style={{ fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {activeJob.errors.length > 0 && (
            <details style={{ marginTop: "1rem" }}>
              <summary style={{ cursor: "pointer", color: "#ef4444", fontSize: "0.875rem" }}>
                {activeJob.errors.length} error(s)
              </summary>
              <ul style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748b", listStyle: "disc", paddingLeft: "1.25rem" }}>
                {activeJob.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Job history */}
      {jobs.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontWeight: 600, marginBottom: "1rem" }}>Job History</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["ID", "Category", "Status", "Pages", "Docs", "Started"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#64748b", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...jobs].reverse().map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.5rem 0.75rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>
                    {job.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{job.category}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span style={{ color: statusColor(job.status), fontWeight: 600 }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{job.scrapedPages}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{job.documents.length}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "#64748b" }}>
                    {job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
