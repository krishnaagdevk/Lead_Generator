import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { sendGmail, decryptToken } from "@/lib/server/gmail";
import crypto from "crypto";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draftId = Number(id);
  if (isNaN(draftId)) return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });

  const draft = await prisma.emailDraft.findUnique({
    where: { id: draftId },
    include: {
      lead: { select: { name: true, email: true } },
      campaign: { include: { emailAccount: true, user: { include: { emailAccounts: true } } } },
    },
  });

  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (draft.campaign.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (draft.status === "sent") return NextResponse.json({ error: "Already sent" }, { status: 400 });
  if (!draft.lead.email) return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });

  let emailAccount = draft.campaign.emailAccount;
  if (!emailAccount) {
    return NextResponse.json({
      error: "No Gmail account connected",
      details: "Please connect a Gmail account in Settings first, then create a campaign with that account selected."
    }, { status: 400 });
  }

  if (emailAccount.oauthTokenEncrypted === "") {
    return NextResponse.json({
      error: "Gmail account not connected",
      details: "This Gmail address was entered directly but not connected via OAuth. Please connect it in Settings first."
    }, { status: 400 });
  }

  try {
    const tokenData = decryptToken(emailAccount.oauthTokenEncrypted);
    const token = crypto.randomBytes(16).toString("hex");
    const pixelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/track/${token}/open.png`;

    const gmailMessageId = await sendGmail(tokenData, draft.lead.email, draft.subject, draft.body, pixelUrl);

    await prisma.emailDraft.update({
      where: { id: draftId },
      data: { status: "sent", sentAt: new Date() },
    });

    await prisma.emailLog.create({
      data: {
        draftId: draft.id,
        campaignId: draft.campaignId,
        leadId: draft.leadId,
        gmailMessageId,
        trackingToken: token,
        status: "sent",
        sentAt: new Date(),
      },
    });

    if (draft.lead.email) {
      const existing = await prisma.lead.findUnique({ where: { id: draft.leadId }, select: { pipelineStage: true } });
      if (existing?.pipelineStage === "new") {
        await prisma.lead.update({ where: { id: draft.leadId }, data: { pipelineStage: "contacted" } });
      }
    }

    return NextResponse.json({ success: true, gmailMessageId });
  } catch (err: any) {
    console.error("Error sending draft:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
