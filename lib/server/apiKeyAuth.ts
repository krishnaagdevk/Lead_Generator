import { NextRequest } from "next/server";
import { prisma } from "../db";
import bcrypt from "bcryptjs";

export async function authenticateApiKey(req: NextRequest): Promise<{ userId: number } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer lh_")) return null;

  const rawKey = authHeader.replace("Bearer ", "");
  const prefix = rawKey.slice(0, 8);

  const keys = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix },
    include: { user: { select: { id: true } } },
  });

  for (const key of keys) {
    const isValid = await bcrypt.compare(rawKey, key.keyHash);
    if (isValid) {
      await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } });
      return { userId: key.user.id };
    }
  }
  return null;
}