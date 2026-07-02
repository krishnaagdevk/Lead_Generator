import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const searchId = Number(id);

    const existing = await prisma.savedSearch.findFirst({
      where: { id: searchId, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    await prisma.savedSearch.delete({
      where: { id: searchId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete saved search" }, { status: 500 });
  }
}
