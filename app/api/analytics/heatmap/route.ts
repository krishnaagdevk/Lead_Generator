import { NextResponse } from "next/server";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = await getTenantUserId(session.userId);

  // Get all leads with coordinates
  const leads = await prisma.lead.findMany({
    where: { userId: tenantId },
    select: {
      id: true,
      name: true,
      address: true,
      lat: true,
      lng: true,
      leadScore: true,
    },
  });

  // Filter leads with coordinates
  const leadsWithCoords = leads.filter(lead => lead.lat && lead.lng);

  return NextResponse.json(leadsWithCoords);
}