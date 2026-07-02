import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const owner = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!owner) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (owner.plan !== "agency" || owner.role !== "owner") {
      return NextResponse.json(
        { error: "Team seats are exclusive to the Agency plan owners." },
        { status: 403 }
      );
    }

    // Check team size quota (e.g. max 5 members)
    const count = await prisma.user.count({ where: { parentId: owner.id } });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Team quota reached. Agency plan covers up to 5 seats." },
        { status: 400 }
      );
    }

    const { email, password } = await req.json() as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const member = await prisma.user.create({
      data: {
        email,
        passwordHash,
        plan: "agency",
        parentId: owner.id,
        role: "member",
      },
    });

    return NextResponse.json({
      id: member.id,
      email: member.email,
      role: member.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to invite member" }, { status: 500 });
  }
}
