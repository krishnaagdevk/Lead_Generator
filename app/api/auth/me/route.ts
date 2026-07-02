import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, plan: true, usageLeads: true, usageAiCalls: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, currentPassword, newPassword, plan } = await req.json() as {
      email?: string;
      currentPassword?: string;
      newPassword?: string;
      plan?: string;
    };

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: any = {};

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
      }
      updateData.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (plan) {
      const validPlans = ["free", "starter", "pro", "agency"];
      if (!validPlans.includes(plan)) {
        return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
      }
      updateData.plan = plan as any;
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: { id: true, email: true, plan: true, usageLeads: true, usageAiCalls: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
