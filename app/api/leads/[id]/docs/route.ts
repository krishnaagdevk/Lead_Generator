import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: Number(id) }
  });
  
  if (!lead || lead.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { contractPrice, contractType, contractMilestones, signAgreement } = await req.json();

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        contractPrice: contractPrice ? Number(contractPrice) : null,
        contractType: contractType || "website",
        contractMilestones: contractMilestones || null,
        ...(signAgreement && {
          contractSignedAt: new Date(),
          pipelineStage: "won", // Automatically win lead in CRM when agreement is signed!
          dealValue: contractPrice ? Number(contractPrice) : null,
          dealClosedAt: new Date()
        })
      }
    });

    return NextResponse.json({
      success: true,
      lead: updated,
      message: signAgreement 
        ? "Milestone Contract Signed & Locked! Lead marked as WON in CRM! 🏆🔥" 
        : "Documents saved successfully."
    });
  } catch (err: any) {
    console.error("Failed to save documents configuration:", err);
    return NextResponse.json({ error: "Failed to update documents." }, { status: 500 });
  }
}
