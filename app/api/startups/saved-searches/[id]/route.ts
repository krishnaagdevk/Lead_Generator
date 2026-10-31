import { NextRequest, NextResponse } from "next/server";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import {
  executeStartupSavedSearch,
  updateStartupSavedSearch,
} from "@/lib/server/startups";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTenantUserId(session.userId);

    const { id } = await params;
    const searchId = Number(id);

    // Run this search immediately and import newly found leads into DB
    const result = await executeStartupSavedSearch(searchId, tenantId);
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    console.error("Execute saved search error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute saved search" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTenantUserId(session.userId);

    const { id } = await params;
    const searchId = Number(id);
    const body = await req.json();

    const updated = await updateStartupSavedSearch(searchId, tenantId, body);
    return NextResponse.json({ ok: true, search: updated });
  } catch (error: any) {
    console.error("Update saved search error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update saved search" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTenantUserId(session.userId);

    const { id } = await params;
    const searchId = Number(id);

    const existing = await prisma.savedSearch.findFirst({
      where: { id: searchId, userId: tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    await prisma.savedSearch.delete({
      where: { id: searchId },
    });

    return NextResponse.json({ ok: true, deletedId: searchId });
  } catch (error: any) {
    console.error("Delete saved search error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete saved search" },
      { status: 500 }
    );
  }
}
