import { NextRequest, NextResponse } from "next/server";
import { loadDocuments } from "@/lib/storage";

// GET /api/documents?category=judgments&page=1&limit=20&q=search-term
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));

  let docs = loadDocuments();

  if (category) {
    docs = docs.filter((d) => d.category === category);
  }

  if (q) {
    docs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
    );
  }

  const total = docs.length;
  const start = (page - 1) * limit;
  const items = docs.slice(start, start + limit);

  return NextResponse.json({
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    items,
  });
}
