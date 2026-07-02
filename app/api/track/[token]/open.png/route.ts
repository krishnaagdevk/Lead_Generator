import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const log = await prisma.emailLog.findUnique({ where: { trackingToken: token } });
  if (log && log.status === "sent") {
    await prisma.emailLog.update({
      where: { trackingToken: token },
      data: { status: "opened", openedAt: new Date() },
    });
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache",
    },
  });
}
