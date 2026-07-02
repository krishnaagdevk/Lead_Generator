import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeCode, encryptToken } from "@/lib/server/gmail";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", req.url));
  }

  try {
    const { tokens, email } = await exchangeCode(code);
    const encrypted = encryptToken(tokens);
    const userId = Number(state);

    const existing = await prisma.emailAccount.findFirst({
      where: { userId, gmailAddress: email },
    });

    if (existing) {
      await prisma.emailAccount.update({
        where: { id: existing.id },
        data: { oauthTokenEncrypted: encrypted },
      });
    } else {
      const count = await prisma.emailAccount.count({ where: { userId } });
      await prisma.emailAccount.create({
        data: {
          userId,
          gmailAddress: email,
          oauthTokenEncrypted: encrypted,
          isDefault: count === 0,
        },
      });
    }

    return NextResponse.redirect(new URL("/settings?connected=1", req.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", req.url));
  }
}
