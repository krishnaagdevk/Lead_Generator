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

  const logs = await prisma.emailLog.findMany({ where: { campaignId: Number(id) } });

  return NextResponse.json({
    campaignId: Number(id),
    sent: logs.filter((l) => ["sent", "opened", "replied"].includes(l.status)).length,
    opened: logs.filter((l) => ["opened", "replied"].includes(l.status)).length,
    replied: logs.filter((l) => l.status === "replied").length,
    bounced: logs.filter((l) => l.status === "bounced").length,
  });
}
