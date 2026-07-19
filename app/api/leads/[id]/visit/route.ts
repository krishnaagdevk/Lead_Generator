import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        physicalVisits: { increment: 1 },
        lastVisitedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      lead: updated,
      xpAwarded: 10,
      message: "Physical visit logged! +10 XP earned on Hustle Hub! 🚶‍♂️🔥"
    });
  } catch (err: any) {
    console.error("Failed to log physical visit:", err);
    return NextResponse.json({ error: "Failed to log physical visit." }, { status: 500 });
  }
}
