import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { analyzeTone } from "@/lib/server/groq";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  const analysis = await analyzeTone(subject, body);
  return NextResponse.json(analysis);
}