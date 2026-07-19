import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        hustleTargetName: true,
        hustleTargetPrice: true,
        studentMajor: true,
        studentUniversity: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's leads to compute earnings and gamification statistics
    const leads = await prisma.lead.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        pipelineStage: true,
        contractPrice: true,
        physicalVisits: true,
        contractSignedAt: true,
        emailLogs: { select: { id: true } },
        emailDrafts: { select: { id: true } }
      }
    });

    // Compute earnings
    const earnings = leads
      .filter((l) => l.pipelineStage === "won")
      .reduce((sum, l) => sum + (l.contractPrice || 0), 0);

    // Compute XP
    const leadsScannedXp = leads.length * 5;
    const physicalVisitsXp = leads.reduce((sum, l) => sum + l.physicalVisits, 0) * 10;
    const closedDealsXp = leads.filter((l) => l.pipelineStage === "won").length * 100;
    
    const totalXp = leadsScannedXp + physicalVisitsXp + closedDealsXp;

    return NextResponse.json({
      user,
      earnings,
      totalXp,
      stats: {
        totalLeads: leads.length,
        physicalVisits: leads.reduce((sum, l) => sum + l.physicalVisits, 0),
        closedDeals: leads.filter((l) => l.pipelineStage === "won").length,
      }
    });
  } catch (err: any) {
    console.error("Failed to fetch student profile stats:", err);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { hustleTargetName, hustleTargetPrice, studentMajor, studentUniversity } = body;

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(hustleTargetName !== undefined && { hustleTargetName }),
        ...(hustleTargetPrice !== undefined && { hustleTargetPrice: Number(hustleTargetPrice) }),
        ...(studentMajor !== undefined && { studentMajor }),
        ...(studentUniversity !== undefined && { studentUniversity }),
      },
      select: {
        id: true,
        hustleTargetName: true,
        hustleTargetPrice: true,
        studentMajor: true,
        studentUniversity: true,
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Failed to update student profile:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
