import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { decryptToken } from "@/lib/server/gmail";
import { exportLeadsToGoogleSheet } from "@/lib/server/exports";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Fetch user's default connected Google/Gmail account
    const account = await prisma.emailAccount.findFirst({
      where: { userId: session.userId, isDefault: true },
    }) || await prisma.emailAccount.findFirst({
      where: { userId: session.userId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Please connect a Gmail/Google account in Settings to export to Google Sheets." },
        { status: 400 }
      );
    }

    const { ids } = await req.json() as { ids?: number[] };

    // 2. Fetch leads (either selected ids or all user leads)
    const leads = await prisma.lead.findMany({
      where: {
        userId: session.userId,
        ...(ids && ids.length > 0 && { id: { in: ids } }),
      },
      orderBy: { createdAt: "desc" },
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: "No leads to export." }, { status: 400 });
    }

    // 3. Decrypt tokens and write to Google Sheets
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tokenData = decryptToken(account.oauthTokenEncrypted);
    const url = await exportLeadsToGoogleSheet(tokenData, leads, user.plan);

    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Export to Google Sheets failed" }, { status: 500 });
  }
}
