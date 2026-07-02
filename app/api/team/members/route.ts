import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);

  const members = await prisma.user.findMany({
    where: {
      OR: [
        { id: tenantId },
        { parentId: tenantId },
      ],
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(members);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const owner = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!owner || owner.plan !== "agency" || owner.role !== "owner") {
      return NextResponse.json({ error: "Only owners can remove team members." }, { status: 403 });
    }

    const { id } = await req.json() as { id?: number };
    if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    const member = await prisma.user.findUnique({ where: { id } });
    if (!member || member.parentId !== owner.id) {
      return NextResponse.json({ error: "Member not found on this team" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove member" }, { status: 500 });
  }
}
