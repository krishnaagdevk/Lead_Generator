import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);
  const accounts = await prisma.emailAccount.findMany({
    where: { userId: tenantId },
    select: { id: true, gmailAddress: true, dailyLimit: true, dailySent: true, isDefault: true, warmupStatus: true, warmupDay: true, createdAt: true },
  });
  return NextResponse.json(accounts);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);
  const { id } = await req.json() as { id: number };
  const account = await prisma.emailAccount.findUnique({ where: { id } });
  if (!account || account.userId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.emailAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenantId = await getTenantUserId(session.userId);
    const { id, warmupStatus, warmupDay } = await req.json() as {
      id: number;
      warmupStatus?: string;
      warmupDay?: number;
    };

    const account = await prisma.emailAccount.findUnique({ where: { id } });
    if (!account || account.userId !== tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.emailAccount.update({
      where: { id },
      data: {
        ...(warmupStatus && { warmupStatus: warmupStatus as any }),
        ...(warmupDay !== undefined && { warmupDay }),
        ...(warmupStatus === "active" && !account.warmupStartDate && { warmupStartDate: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update email account" }, { status: 500 });
  }
}
