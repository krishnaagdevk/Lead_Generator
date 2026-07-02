import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { getAuthUrl } from "@/lib/server/gmail";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authUrl = getAuthUrl(session.userId);
  return NextResponse.json({ authUrl });
}
