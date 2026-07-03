import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

// GET /api/campaigns/[id]/steps → list all steps
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const steps = await prisma.sequenceStep.findMany({
    where: { campaignId: Number(id) },
    orderBy: { stepNumber: "asc" },
  });
  return NextResponse.json(steps);
}

// POST /api/campaigns/[id]/steps → add a step
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { delayDays, subject, body } = await req.json();
  const maxStep = await prisma.sequenceStep.aggregate({
    _max: { stepNumber: true },
    where: { campaignId: Number(id) },
  });

  const step = await prisma.sequenceStep.create({
    data: {
      campaignId: Number(id),
      stepNumber: (maxStep._max.stepNumber ?? 0) + 1,
      delayDays: delayDays ?? 3,
      subject,
      body,
    },
  });
  return NextResponse.json(step);
}