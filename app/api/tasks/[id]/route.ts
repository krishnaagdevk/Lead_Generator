import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

// PATCH → mark as complete / update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(task);
}

// DELETE → delete task
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.task.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}