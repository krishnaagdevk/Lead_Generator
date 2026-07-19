import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { enqueueJob } from "@/lib/server/queue";
import { checkAiLimit } from "@/lib/server/planLimits";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Apply rate limiting: 5 generate requests per minute per user
    const rl = await rateLimit(`generate_user_${session.userId}`, 5, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many draft generation requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    // Check plan limits
    const limitCheck = await checkAiLimit(session.userId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "AI generation limit reached. Upgrade your plan to generate more drafts." },
        { status: 402 }
      );
    }

    const { searchParams } = new URL(_req.url);
    const model = searchParams.get("model") || undefined;

    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id: Number(id) } });
    if (!campaign || campaign.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await enqueueJob("ai_draft", { campaignId: campaign.id, model });
    return NextResponse.json({ message: "Generation started" }, { status: 202 });
  } catch (err) {
    console.error("Generate POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
