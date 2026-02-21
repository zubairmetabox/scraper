import { NextRequest, NextResponse } from "next/server";
import { queryDocuments } from "@/lib/storage";

// GET /api/documents?category=judgments&page=1&limit=20&q=search-term
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));

  const { total, items } = await queryDocuments({ category, q, page, limit });

  return NextResponse.json({
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    items,
  });
}
