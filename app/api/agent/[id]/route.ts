import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { resumeRun, cancelRun, setMode } from "@/lib/server/agent/run";

const MODES = ["plan_only", "hitl", "autonomous"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getTenantUserId(session.userId);
  const { id } = await params;

  const run = await prisma.agentRun.findFirst({
    where: { id: Number(id), userId },
    include: { steps: { orderBy: { idx: "asc" } } },
  });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(run);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getTenantUserId(session.userId);
  const { id } = await params;

  const run = await prisma.agentRun.findFirst({ where: { id: Number(id), userId } });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "approve") {
    await resumeRun(run.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "cancel") {
    await cancelRun(run.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getTenantUserId(session.userId);
  const { id } = await params;

  const run = await prisma.agentRun.findFirst({ where: { id: Number(id), userId } });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "");
  if (!MODES.includes(mode)) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  await setMode(run.id, mode as any);
  return NextResponse.json({ ok: true });
}
