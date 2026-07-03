import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { rankSubjectLines } from "@/lib/server/groq";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subjects, businessName } = await req.json();
  if (!subjects || !Array.isArray(subjects) || subjects.length < 2) {
    return NextResponse.json({ error: "At least 2 subject lines required" }, { status: 400 });
  }

  const ranked = await rankSubjectLines(subjects, businessName);
  return NextResponse.json(ranked);
}