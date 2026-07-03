import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { enqueueJob } from "@/lib/server/queue";
import { prisma } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = Number(id);
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.userId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await enqueueJob("enrich_lead", { leadId });
  return NextResponse.json({ queued: true });
}