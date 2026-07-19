import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { enqueueJob } from "@/lib/server/queue";

const MODES = ["plan_only", "hitl", "autonomous"];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getTenantUserId(session.userId);

    const body = await req.json();
    const goal = String(body.goal ?? "").trim();
    const mode = MODES.includes(body.mode) ? body.mode : "hitl";
    if (!goal) return NextResponse.json({ error: "Goal is required" }, { status: 400 });

    const run = await prisma.agentRun.create({
      data: { userId, goal, mode },
    });

    await enqueueJob("agent_run", { runId: run.id }, 0);
    return NextResponse.json(run, { status: 201 });
  } catch (err) {
    console.error("Agent create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getTenantUserId(session.userId);

  const runs = await prisma.agentRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      goal: true,
      mode: true,
      status: true,
      finalSummary: true,
      stepCount: true,
      createdAt: true,
      _count: { select: { steps: true } },
    },
  });
  return NextResponse.json(runs);
}
