import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getTenantUserId } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantUserId(session.userId);

  const campaigns = await prisma.campaign.findMany({
    where: { userId: tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { drafts: true, logs: true } },
    },
  });
  return NextResponse.json(campaigns);
}

function resolveTemplate(text: string, lead: any, variantIndex: number): string {
  const variants = text.split("|||");
  const selected = variants[variantIndex % variants.length].trim();

  const city = lead.address?.split(",").slice(-2, -1)[0]?.trim() ?? "";
  const statusMsg =
    lead.websiteStatus === "no_website"
      ? "no website"
      : lead.websiteStatus === "broken"
      ? "a broken website"
      : "a website";

  return selected
    .replace(/\{\{business_name\}\}/g, lead.name)
    .replace(/\{\{name\}\}/g, lead.name)
    .replace(/\{\{category\}\}/g, lead.category ?? "business")
    .replace(/\{\{city\}\}/g, city)
    .replace(/\{\{website_status\}\}/g, statusMsg)
    .replace(/\{\{rating\}\}/g, lead.rating ? String(lead.rating) : "N/A")
    .replace(/\{\{reviews\}\}/g, lead.reviewCount ? String(lead.reviewCount) : "0");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, templateSubject, templateBody, emailAccountId, gmailAddress, leadIds, scheduledAt, followUpDays } =
    await req.json() as {
      name: string;
      templateSubject: string;
      templateBody: string;
      emailAccountId?: number;
      gmailAddress?: string;
      leadIds: number[];
      scheduledAt?: string;
      followUpDays?: number;
    };

  const tenantId = await getTenantUserId(session.userId);

  // Fetch leads to resolve variables
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, userId: tenantId },
  });

  let campaignEmailAccountId = emailAccountId ?? null;
  
  // If gmailAddress is provided, create a temporary email account
  if (gmailAddress && !emailAccountId) {
    const tempAccount = await prisma.emailAccount.create({
      data: {
        userId: tenantId,
        gmailAddress,
        oauthTokenEncrypted: "", // No OAuth token for direct sending
        isDefault: false,
      },
    });
    campaignEmailAccountId = tempAccount.id;
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: tenantId,
      name,
      templateSubject,
      templateBody,
      emailAccountId: campaignEmailAccountId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      followUpDays: followUpDays ?? null,
      drafts: {
        create: leads.map((lead, idx) => ({
          leadId: lead.id,
          subject: resolveTemplate(templateSubject, lead, idx),
          body: resolveTemplate(templateBody, lead, idx),
        })),
      },
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
