import { NextResponse } from "next/server";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = await getTenantUserId(session.userId);

  const leads = await prisma.lead.groupBy({
    by: ["pipelineStage"],
    where: { userId: tenantId, dealValue: { not: null } },
    _count: { id: true },
    _sum: { dealValue: true },
  });

  return NextResponse.json(
    leads.map(l => ({
      stage: l.pipelineStage,
      count: l._count.id,
      totalValue: l._sum.dealValue ?? 0,
    }))
  );
}