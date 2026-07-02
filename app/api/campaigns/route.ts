import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { drafts: true, logs: true } },
    },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, templateSubject, templateBody, emailAccountId, leadIds, scheduledAt, followUpDays } =
    await req.json() as {
      name: string;
      templateSubject: string;
      templateBody: string;
      emailAccountId?: number;
      leadIds: number[];
      scheduledAt?: string;
      followUpDays?: number;
    };

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.userId,
      name,
      templateSubject,
      templateBody,
      emailAccountId: emailAccountId ?? null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      followUpDays: followUpDays ?? null,
      drafts: {
        create: leadIds.map((leadId) => ({
          leadId,
          subject: templateSubject,
          body: templateBody,
        })),
      },
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
