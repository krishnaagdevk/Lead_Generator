import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const allowed = [
    "calendlyUrl", "slackBotToken", "slackChannelId",
    "webhookUrl", "webhookEnabled",
    "brandName", "brandLogo", "brandColor", "whiteLabel",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      id: true, email: true, plan: true,
      calendlyUrl: true, slackBotToken: true, slackChannelId: true,
      webhookUrl: true, webhookEnabled: true,
      brandName: true, brandLogo: true, brandColor: true, whiteLabel: true,
    },
  });

  return NextResponse.json(updated);
}