import { NextResponse } from "next/server";
import { processBatch, getQueueStats } from "@/features/intelligence/embeddings/embedding.queue";

// Called by Vercel Cron or any webhook runner
// Set EMBED_JOB_SECRET in env to secure the endpoint
export async function POST(request: Request) {
  const secret = process.env.EMBED_JOB_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { processed, failed } = await processBatch(20);
  const stats = await getQueueStats();

  return NextResponse.json({ ok: true, processed, failed, queue: stats });
}

export async function GET(request: Request) {
  const secret = process.env.EMBED_JOB_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stats = await getQueueStats();
  return NextResponse.json({ ok: true, queue: stats });
}
