import { NextRequest, NextResponse } from "next/server";
import { loadDocuments, exportAsNDJSON } from "@/lib/storage";
import { ScraperCategory } from "@/types";

// GET /api/export?format=json|ndjson&category=judgments
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") || "json";
  const category = searchParams.get("category") as ScraperCategory | null;

  let docs = loadDocuments();
  if (category) {
    docs = docs.filter((d) => d.category === category);
  }

  if (format === "ndjson") {
    const ndjson = docs.map((d) => JSON.stringify(d)).join("\n");
    return new NextResponse(ndjson, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="govmu-legal-${category || "all"}.ndjson"`,
      },
    });
  }

  // Default: JSON
  return new NextResponse(JSON.stringify(docs, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="govmu-legal-${category || "all"}.json"`,
    },
  });
}
