import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { enqueueJob } from "@/lib/server/queue";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id: Number(id) } });
  if (!campaign || campaign.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!campaign.emailAccountId) {
    return NextResponse.json({ error: "No Gmail account selected" }, { status: 400 });
  }

  const delaySeconds = campaign.scheduledAt
    ? Math.max(0, Math.floor((campaign.scheduledAt.getTime() - Date.now()) / 1000))
    : 0;

  await enqueueJob("send", { campaignId: campaign.id }, delaySeconds);
  return NextResponse.json({ message: "Sending scheduled/started" }, { status: 202 });
}
