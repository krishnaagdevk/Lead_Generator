import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { callLLM } from "@/lib/server/groq";

const OBJECTION_COACH_SYSTEM = `You are an elite sales coach specializing in helping student developers pitch website and app development services to local physical businesses.
Your tone is highly motivating, practical, and punchy (no generic B2B jargon, think of a supportive tech-hustler mentor).

The business has raised an objection. Provide a bulletproof comeback, a supportive proof point, and an actionable practice tip.

Return ONLY a valid, parseable JSON object matching this schema:
{
  "comeback": "A conversational, high-confidence reframe that turns the objection into an opportunity (e.g., if they say 'Instagram is enough', explain that Instagram is leased space while a website is owned land that ranks on Google). Keep it friendly but powerful.",
  "proof": "A quick, realistic statistic or proof point that backs up this reframe.",
  "practiceTip": "A fun, practical micro-coaching tip for the student on how to say this with confidence or a psychological trick to use."
}

Do not include any explanation or markdown wraps. Only raw JSON.`;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: Number(id) }
  });
  
  if (!lead || lead.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { objection } = await req.json();
    if (!objection) {
      return NextResponse.json({ error: "Objection text is required" }, { status: 400 });
    }

    const city = lead.address ? lead.address.split(",").slice(-3, -2)[0]?.trim() || "their city" : "their city";
    const prompt = `Business: ${lead.name}, a ${lead.category ?? "local business"} in ${city}.
Website status: ${lead.websiteStatus ?? "no website"}.
Google Maps Rating: ${lead.rating ? `${lead.rating}/5 stars` : "No rating yet"}.
Objection Raised by Owner: "${objection}"
Provide the ultimate hustle response.`;

    const coachResponse = await callLLM({
      systemPrompt: OBJECTION_COACH_SYSTEM,
      userPrompt: prompt,
      responseFormatJson: true,
      maxTokens: 500,
      temperature: 0.7
    });

    return NextResponse.json(JSON.parse(coachResponse));
  } catch (err: any) {
    console.error("Failed to generate objection comeback:", err);
    return NextResponse.json({ error: "Failed to generate comeback coaching." }, { status: 500 });
  }
}
