import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { enqueueJob } from "@/lib/server/queue";
import { checkLeadLimit } from "@/lib/server/planLimits";
import { rateLimit } from "@/lib/server/rateLimit";
import { searchSchema } from "@/lib/server/schemas";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await getTenantUserId(session.userId);

    // Apply rate limiting: 10 search requests per minute per user
    const rl = await rateLimit(`search_user_${tenantId}`, 10, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    // Check plan limits
    const limitCheck = await checkLeadLimit(tenantId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Lead limit reached. Upgrade your plan to find more leads." },
        { status: 402 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { businessType, geoQuery } = validation.data;

    const job = await prisma.searchJob.create({
      data: { userId: tenantId, businessType, geoQuery: geoQuery as any },
    });

    // Enqueue job to run in background reliably
    await enqueueJob("search", { jobId: job.id });

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("Search POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
