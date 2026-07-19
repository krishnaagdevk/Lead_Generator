import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { generateMockup } from "@/lib/server/groq";

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
    const city = lead.address ? lead.address.split(",").slice(-3, -2)[0]?.trim() || "their city" : "their city";
    const mockup = await generateMockup({
      name: lead.name,
      category: lead.category,
      city,
      websiteStatus: lead.websiteStatus,
      rating: lead.rating,
      reviewCount: lead.reviewCount
    });

    return NextResponse.json(mockup);
  } catch (err: any) {
    console.error("Failed to generate AI mockup:", err);
    return NextResponse.json({ error: "Failed to generate mockup specs." }, { status: 500 });
  }
}
