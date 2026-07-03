import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { generateCallScript } from "@/lib/server/groq";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findFirst({ where: { id: Number(id) } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const script = await generateCallScript({
    name: lead.name,
    category: lead.category ?? undefined,
    city: lead.address?.split(",")[1]?.trim(),
    websiteStatus: lead.websiteStatus,
  });

  return NextResponse.json(script);
}