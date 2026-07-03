import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey } from "@/lib/server/apiKeyAuth";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized. Provide a valid API key in the Authorization header." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));
  const pipelineStage = searchParams.get("pipelineStage");
  const search = searchParams.get("search");

  const where: any = { userId: auth.userId };
  if (pipelineStage) where.pipelineStage = pipelineStage;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        websiteUrl: true, websiteStatus: true, category: true, rating: true,
        reviewCount: true, leadScore: true, pipelineStage: true,
        dealValue: true, domainExpiryDate: true, domainExpiresInDays: true,
        mapsUrl: true, createdAt: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const { WebsiteStatus } = await import("@/lib/generated/prisma/enums");

  // Create a search job placeholder if none exists for API-created leads
  const searchJob = await prisma.searchJob.upsert({
    where: { id: 0 },
    create: { userId: auth.userId, businessType: "api", geoQuery: {}, status: "done" as any },
    update: {},
  }).catch(() => null);

  const lead = await prisma.lead.create({
    data: {
      userId: auth.userId,
      placeId: body.placeId ?? `manual-${Date.now()}`,
      searchJobId: searchJob?.id ?? 0,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      websiteUrl: body.websiteUrl ?? null,
      category: body.category ?? null,
      rating: body.rating ?? null,
      reviewCount: body.reviewCount ?? null,
      mapsUrl: body.mapsUrl ?? null,
      notes: body.notes ?? null,
      websiteStatus: WebsiteStatus.unknown,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}