import { NextRequest, NextResponse } from "next/server";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { enqueueJob } from "@/lib/server/queue";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json() as { ids?: number[] };
  const tenantId = await getTenantUserId(session.userId);

  // If ids provided, enrich those. Otherwise enrich all leads without email.
  const leads = await prisma.lead.findMany({
    where: {
      userId: tenantId,
      email: null,
      ...(ids?.length ? { id: { in: ids } } : {}),
    },
    select: { id: true },
    take: 50, // rate limit
  });

  for (const lead of leads) {
    await enqueueJob("enrich_lead", { leadId: lead.id }, 0);
  }

  return NextResponse.json({ queued: leads.length });
}