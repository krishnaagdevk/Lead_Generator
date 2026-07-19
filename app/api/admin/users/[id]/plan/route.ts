import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/config/plans";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify requesting user is the owner
    const requestingUser = await prisma.user.findUnique({ where: { id: session.userId } });
    const ownerEmail = process.env.OWNER_EMAIL || "";

    if (!requestingUser || requestingUser.email.toLowerCase() !== ownerEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = Number(id);
    const { plan } = await req.json() as { plan: string };

    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Update target user's plan manually
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        plan,
        razorpayPlanStatus: plan === "free" ? null : "active",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        plan: updatedUser.plan,
      },
    });
  } catch (err) {
    console.error("Admin plan update error:", err);
    return NextResponse.json({ error: "Failed to update user plan" }, { status: 500 });
  }
}
