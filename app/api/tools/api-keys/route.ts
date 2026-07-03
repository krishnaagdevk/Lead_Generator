import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateApiKey(): { prefix: string; raw: string; hash: string } {
  const raw = `lh_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 8);
  const hash = bcrypt.hashSync(raw, 10);
  return { prefix, raw, hash };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { prefix, raw, hash } = generateApiKey();
  const userId = session.userId;

  await prisma.apiKey.create({ data: { userId, name, keyHash: hash, keyPrefix: prefix } });

  return NextResponse.json({ raw, prefix, name }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const key = await prisma.apiKey.findFirst({
    where: { id: Number(id), userId: session.userId },
  });
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.apiKey.delete({ where: { id: key.id } });
  return NextResponse.json({ deleted: true });
}