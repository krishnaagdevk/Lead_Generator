import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { enqueueJob } from "@/lib/server/queue";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);
  const { businessType, geoQuery } = await req.json() as { businessType: string; geoQuery: object };

  const job = await prisma.searchJob.create({
    data: { userId: tenantId, businessType, geoQuery },
  });

  // Enqueue job to run in background reliably
  await enqueueJob("search", { jobId: job.id });

  return NextResponse.json(job, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);
  const jobs = await prisma.searchJob.findMany({
    where: { userId: tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(jobs);
}
