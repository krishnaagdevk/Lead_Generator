import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id: Number(id) } });
  if (!campaign || campaign.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const drafts = await prisma.emailDraft.findMany({
    where: { campaignId: Number(id) },
    include: { lead: { select: { name: true, email: true, websiteStatus: true, category: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(drafts);
}
