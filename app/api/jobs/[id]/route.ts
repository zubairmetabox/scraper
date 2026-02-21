import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/storage";

// GET /api/jobs/:id — poll a specific job's status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { documents, ...summary } = job;
  return NextResponse.json({
    ...summary,
    documentCount: documents.length,
  });
}
