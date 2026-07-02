import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: Number(id) },
    include: {
      emailLogs: {
        include: { campaign: { select: { name: true } } },
        orderBy: { sentAt: "desc" },
      },
      emailDrafts: {
        include: { campaign: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!lead || lead.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });
  if (!lead || lead.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  const allowed = ["pipelineStage", "notes", "email", "phone"] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) data[key] = body[key];

  const updated = await prisma.lead.update({ where: { id: Number(id) }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });
  if (!lead || lead.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete associated logs and drafts first to respect foreign keys, then delete lead
  await prisma.$transaction([
    prisma.emailLog.deleteMany({ where: { leadId: lead.id } }),
    prisma.emailDraft.deleteMany({ where: { leadId: lead.id } }),
    prisma.lead.delete({ where: { id: lead.id } }),
  ]);

  return NextResponse.json({ success: true });
}
