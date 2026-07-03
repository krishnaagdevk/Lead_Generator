import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { enqueueJob } from "@/lib/server/queue";

// POST { leadIds: number[] } → enroll leads into the sequence
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { leadIds } = await req.json() as { leadIds: number[] };
  const campaignId = Number(id);

  const firstStep = await prisma.sequenceStep.findFirst({
    where: { campaignId, stepNumber: 1 },
  });
  if (!firstStep) return NextResponse.json({ error: "No steps defined" }, { status: 400 });

  const enrollments = await prisma.$transaction(
    leadIds.map(leadId =>
      prisma.sequenceEnrollment.upsert({
        where: { leadId_campaignId: { leadId, campaignId } } as any,
        update: {},
        create: {
          leadId,
          campaignId,
          stepId: firstStep.id,
          currentStep: 1,
          status: "active",
          nextSendAt: new Date(), // send immediately
        },
      })
    )
  );

  // Enqueue the sequence processor
  await enqueueJob("process_sequences", {}, 0);

  return NextResponse.json({ enrolled: enrollments.length });
}