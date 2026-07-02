import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { enqueueJob } from "@/lib/server/queue";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.emailDraft.findUnique({
    where: { id: Number(id) },
    include: { campaign: true },
  });
  if (!draft || draft.campaign.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.emailDraft.update({ where: { id: Number(id) }, data: { editedByUser: false } });
  await enqueueJob("ai_draft", { campaignId: draft.campaignId });
  return NextResponse.json({ message: "Regeneration started" });
}
