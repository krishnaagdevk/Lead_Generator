import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

// PATCH → update a step
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stepId } = await params;
  const body = await req.json();
  const step = await prisma.sequenceStep.update({ where: { id: Number(stepId) }, data: body });
  return NextResponse.json(step);
}

// DELETE → delete a step
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stepId } = await params;
  await prisma.sequenceStep.delete({ where: { id: Number(stepId) } });
  return NextResponse.json({ deleted: true });
}