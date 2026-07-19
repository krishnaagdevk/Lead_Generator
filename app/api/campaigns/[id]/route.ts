import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);
  const { id } = await params;
  const campaignId = Number(id);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.userId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete everything related to the campaign first in a transaction
  await prisma.$transaction([
    prisma.sequenceEnrollment.deleteMany({ where: { campaignId } }),
    prisma.sequenceStep.deleteMany({ where: { campaignId } }),
    prisma.emailDraft.deleteMany({ where: { campaignId } }),
    prisma.emailLog.deleteMany({ where: { campaignId } }),
    prisma.campaign.delete({ where: { id: campaignId } }),
  ]);

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);
  const { id } = await params;
  const campaignId = Number(id);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.userId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, emailAccountId } = await req.json();

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...(name !== undefined && { name }),
      ...(emailAccountId !== undefined && { emailAccountId: emailAccountId || null }),
    },
  });

  return NextResponse.json(updated);
}
