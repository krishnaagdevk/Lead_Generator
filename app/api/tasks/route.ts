import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

// GET → list all tasks for user, optionally filtered by leadId
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  const tasks = await prisma.task.findMany({
    where: { userId: session.userId, ...(leadId ? { leadId: Number(leadId) } : {}) },
    orderBy: { dueAt: "asc" },
  });
  return NextResponse.json(tasks);
}

// POST → create a task
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const task = await prisma.task.create({
    data: { userId: session.userId, ...body, dueAt: new Date(body.dueAt) },
  });
  return NextResponse.json(task);
}