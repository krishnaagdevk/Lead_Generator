import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { checkSpamScore } from "@/lib/server/groq";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject || !body) return NextResponse.json({ error: "subject and body required" }, { status: 400 });

  const result = await checkSpamScore(subject, body);
  return NextResponse.json(result);
}