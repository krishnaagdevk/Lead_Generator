import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const log = await prisma.emailLog.findUnique({
    where: { trackingToken: token },
    include: { lead: true },
  });

  if (log?.lead?.email) {
    const existing = await prisma.suppression.findFirst({
      where: { userId: log.lead.userId, emailAddress: log.lead.email },
    });
    if (!existing) {
      await prisma.suppression.create({
        data: { userId: log.lead.userId, emailAddress: log.lead.email, reason: "unsubscribe" },
      }).catch(() => {});
    }
  }

  return new NextResponse("You have been unsubscribed. You won't receive further emails.", {
    headers: { "Content-Type": "text/plain" },
  });
}
