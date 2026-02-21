import { NextRequest, NextResponse } from "next/server";
import { loadAllDocuments } from "@/lib/storage";
import { ScraperCategory } from "@/types";

// GET /api/export?format=json|ndjson&category=judgments
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") || "json";
  const category = searchParams.get("category") as ScraperCategory | null;

  const docs = await loadAllDocuments(category ?? undefined);

  if (format === "ndjson") {
    const ndjson = docs.map((d) => JSON.stringify(d)).join("\n");
    return new NextResponse(ndjson, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="govmu-legal-${category || "all"}.ndjson"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(docs, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="govmu-legal-${category || "all"}.json"`,
    },
  });
}
