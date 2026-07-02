import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenantId = await getTenantUserId(session.userId);
    const saved = await prisma.savedSearch.findMany({
      where: { userId: tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch saved searches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenantId = await getTenantUserId(session.userId);
    const { name, businessType, geoQuery } = await req.json() as {
      name: string;
      businessType: string;
      geoQuery: any;
    };

    if (!name || !businessType || !geoQuery) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const saved = await prisma.savedSearch.create({
      data: {
        userId: tenantId,
        name,
        businessType,
        geoQuery,
      },
    });

    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save search" }, { status: 500 });
  }
}
