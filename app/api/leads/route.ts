import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);

  const sp = req.nextUrl.searchParams;
  const websiteStatus = sp.get("websiteStatus") ?? undefined;
  const hasEmail = sp.get("hasEmail");
  const minRating = sp.get("minRating") ? Number(sp.get("minRating")) : undefined;
  const minScore = sp.get("minScore") ? Number(sp.get("minScore")) : undefined;
  const sortBy = sp.get("sortBy") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const searchJobId = sp.get("searchJobId") ? Number(sp.get("searchJobId")) : undefined;
  const pipelineStage = sp.get("pipelineStage") ?? undefined;

  const where = {
    userId: tenantId,
    ...(websiteStatus && { websiteStatus: websiteStatus as never }),
    ...(hasEmail === "true" && { email: { not: null } }),
    ...(hasEmail === "false" && { email: null }),
    ...(minRating !== undefined && { rating: { gte: minRating } }),
    ...(minScore !== undefined && { leadScore: { gte: minScore } }),
    ...(category && { category: { contains: category, mode: "insensitive" as const } }),
    ...(searchJobId && { searchJobId }),
    ...(pipelineStage && { pipelineStage: pipelineStage as never }),
  };

  const orderBy = sortBy === "score" 
    ? { leadScore: "desc" as const } 
    : sortBy === "rating" 
    ? { rating: "desc" as const } 
    : { createdAt: "desc" as const };

  const items = await prisma.lead.findMany({
    where,
    orderBy,
  });

  return NextResponse.json({ items, total: items.length });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);

  const { ids } = await req.json() as { ids: number[] };
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Invalid list of IDs" }, { status: 400 });
  }

  // Verify all these leads belong to the user
  const leads = await prisma.lead.findMany({
    where: { id: { in: ids }, userId: tenantId },
    select: { id: true },
  });
  const validIds = leads.map((l) => l.id);

  if (validIds.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  // Delete associated drafts and logs first, then delete the leads
  await prisma.$transaction([
    prisma.emailLog.deleteMany({ where: { leadId: { in: validIds } } }),
    prisma.emailDraft.deleteMany({ where: { leadId: { in: validIds } } }),
    prisma.lead.deleteMany({ where: { id: { in: validIds } } }),
  ]);

  return NextResponse.json({ success: true, count: validIds.length });
}
