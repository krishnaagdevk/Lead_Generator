import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { exportLeadsToNotion } from "@/lib/server/notion";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return NextResponse.json({ error: "Notion not configured (missing NOTION_API_KEY or NOTION_DATABASE_ID)" }, { status: 400 });
  }

  const { leadIds } = await req.json();
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds array required" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, userId: session.userId },
    select: { name: true, email: true, phone: true, address: true, websiteStatus: true, leadScore: true, mapsUrl: true },
  });

  const exported = await exportLeadsToNotion(leads);
  return NextResponse.json({ exported });
}