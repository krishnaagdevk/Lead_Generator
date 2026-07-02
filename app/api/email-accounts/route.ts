import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.userId },
    select: { id: true, gmailAddress: true, dailyLimit: true, dailySent: true, isDefault: true, createdAt: true },
  });
  return NextResponse.json(accounts);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: number };
  const account = await prisma.emailAccount.findUnique({ where: { id } });
  if (!account || account.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.emailAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
