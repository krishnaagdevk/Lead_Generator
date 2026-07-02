"use server";

import { prisma } from "../db";
import {
  WebsiteStatus,
  BestContact,
  PipelineStage,
  DraftStatus,
  EmailLogStatus,
  CampaignStatus,
  SearchStatus,
} from "../generated/prisma/enums";
import { extractContactInfo } from "./crawler";
import { cityToLatLng, pointInPolygon } from "./geocoding";
import { sendGmail, decryptToken } from "./gmail";
import { generateDraft } from "./groq";
import { checkWebsite } from "./ping";
import { searchNearby, searchText, normalizePlace } from "./places";
import { enqueueJob } from "./queue";

type GeoQuery =
  | { mode: "radius"; lat: number; lng: number; radius_km: number }
  | { mode: "polygon"; coords: Array<{ lat: number; lng: number }> }
  | { mode: "city"; city: string; country?: string }
  | { mode: "multi_city"; cities: string[]; country?: string };

// ── Search Job ────────────────────────────────────────────────────────────────

export async function runSearchJob(jobId: number): Promise<void> {
  try {
    await prisma.searchJob.update({ where: { id: jobId }, data: { status: SearchStatus.running } });

    const job = await prisma.searchJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    const gq = job.geoQuery as GeoQuery;
    let rawPlaces: unknown[] = [];

    if (gq.mode === "radius") {
      rawPlaces = await searchNearby(job.businessType, gq.lat, gq.lng, gq.radius_km * 1000);
    } else if (gq.mode === "polygon") {
      const centLat = gq.coords.reduce((s, c) => s + c.lat, 0) / gq.coords.length;
      const centLng = gq.coords.reduce((s, c) => s + c.lng, 0) / gq.coords.length;
      const all = await searchNearby(job.businessType, centLat, centLng, 15000);
      rawPlaces = all.filter((p) => {
        const loc = (p as { geometry?: { location?: { lat: number; lng: number } } }).geometry?.location;
        return loc ? pointInPolygon(loc.lat, loc.lng, gq.coords) : false;
      });
    } else if (gq.mode === "city") {
      const latLng = await cityToLatLng(gq.city, gq.country ?? "US");
      rawPlaces = latLng
        ? await searchNearby(job.businessType, latLng[0], latLng[1], 10000)
        : await searchText(job.businessType, `${gq.city}, ${gq.country ?? "US"}`);
    } else if (gq.mode === "multi_city") {
      const seen = new Set<string>();
      for (const city of gq.cities) {
        const latLng = await cityToLatLng(city, gq.country ?? "US");
        const places = latLng
          ? await searchNearby(job.businessType, latLng[0], latLng[1], 10000)
          : await searchText(job.businessType, city);
        for (const p of places) {
          const pid = (p as { place_id?: string }).place_id ?? "";
          if (!seen.has(pid)) { seen.add(pid); rawPlaces.push(p); }
        }
      }
    }

    const existing = await prisma.lead.findMany({
      where: { userId: job.userId, searchJobId: jobId },
      select: { placeId: true },
    });
    const existingIds = new Set(existing.map((l) => l.placeId));

    let count = 0;
    const newLeads: Array<{
      userId: number; searchJobId: number; placeId: string; name: string;
      category: string | null; address: string | null; phone: string | null;
      websiteUrl: string | null; websiteStatus: WebsiteStatus; rating: number | null;
      reviewCount: number | null; mapsUrl: string | null;
    }> = [];

    for (const raw of rawPlaces) {
      const norm = normalizePlace(raw as Record<string, unknown>);
      if (!norm.placeId || existingIds.has(norm.placeId as string)) continue;
      existingIds.add(norm.placeId as string);

      newLeads.push({
        userId: job.userId,
        searchJobId: jobId,
        placeId: norm.placeId as string,
        name: (norm.name as string) || "Unknown",
        category: norm.category as string | null,
        address: norm.address as string | null,
        phone: norm.phone as string | null,
        websiteUrl: norm.websiteUrl as string | null,
        websiteStatus: WebsiteStatus.unknown,
        rating: norm.rating as number | null,
        reviewCount: norm.reviewCount as number | null,
        mapsUrl: norm.mapsUrl as string | null,
      });
      count++;
    }

    await prisma.lead.createMany({ data: newLeads });
    await prisma.searchJob.update({
      where: { id: jobId },
      data: { status: SearchStatus.done, totalFound: count, completedAt: new Date() },
    });

    const leads = await prisma.lead.findMany({
      where: { searchJobId: jobId, websiteStatus: WebsiteStatus.unknown },
      select: { id: true },
    });
    leads.forEach((l) => enqueueJob("ping", { leadId: l.id }).catch(() => {}));
  } catch (err) {
    await prisma.searchJob.update({
      where: { id: jobId },
      data: { status: SearchStatus.failed, error: String(err) },
    }).catch(() => {});
  }
}

// ── Website Ping ──────────────────────────────────────────────────────────────

export async function pingLead(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const status = await checkWebsite(lead.websiteUrl) as WebsiteStatus;
  const bestContact = lead.email
    ? BestContact.email
    : lead.phone
    ? BestContact.phone
    : lead.socialLinks
    ? BestContact.social
    : null;

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: { websiteStatus: status, ...(bestContact && { bestContact }) },
  });

  if (status === WebsiteStatus.live && !updatedLead.email) {
    await enqueueJob("crawl", { leadId });
  }
}

// ── Contact Crawl ─────────────────────────────────────────────────────────────

export async function crawlLead(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.websiteUrl) return;

  const info = await extractContactInfo(lead.websiteUrl);
  const bestContact = info.email
    ? BestContact.email
    : lead.phone
    ? BestContact.phone
    : Object.keys(info.socialLinks).length
    ? BestContact.social
    : null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      email: info.email ?? lead.email,
      ...(Object.keys(info.socialLinks).length && { socialLinks: info.socialLinks }),
      ...(bestContact && { bestContact }),
    },
  });
}

// ── AI Drafts ─────────────────────────────────────────────────────────────────

export async function generateCampaignDrafts(campaignId: number): Promise<void> {
  const drafts = await prisma.emailDraft.findMany({
    where: { campaignId, status: DraftStatus.pending, editedByUser: false },
    include: { lead: true },
  });

  for (const draft of drafts) {
    try {
      const city = draft.lead.address?.split(",").slice(-2, -1)[0]?.trim() ?? "";
      const result = await generateDraft({
        name: draft.lead.name,
        category: draft.lead.category,
        city,
        websiteStatus: draft.lead.websiteStatus,
      });
      await prisma.emailDraft.update({
        where: { id: draft.id },
        data: { subject: result.subject, body: result.body },
      });
      await prisma.user.update({
        where: { id: draft.lead.userId },
        data: { usageAiCalls: { increment: 1 } },
      });
    } catch {
      continue;
    }
  }
}

// ── Bulk Send ─────────────────────────────────────────────────────────────────

export async function sendCampaign(campaignId: number): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { emailAccount: true },
  });
  if (!campaign?.emailAccount) return;

  const tokenData = decryptToken(campaign.emailAccount.oauthTokenEncrypted);
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: CampaignStatus.running } });

  const drafts = await prisma.emailDraft.findMany({
    where: { campaignId, status: DraftStatus.pending },
    include: { lead: true },
  });

  for (const draft of drafts) {
    if (!draft.lead.email) continue;

    const suppressed = await prisma.suppression.findFirst({
      where: { userId: campaign.userId, emailAddress: draft.lead.email },
    });
    if (suppressed) {
      await prisma.emailDraft.update({ where: { id: draft.id }, data: { status: DraftStatus.skipped } });
      continue;
    }

    const account = await prisma.emailAccount.findUnique({ where: { id: campaign.emailAccount.id } });
    if (!account || account.dailySent >= account.dailyLimit) break;

    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/${token}/open.png`;

      const msgId = await sendGmail(tokenData, draft.lead.email, draft.subject, draft.body, pixelUrl);

      await prisma.$transaction([
        prisma.emailDraft.update({ where: { id: draft.id }, data: { status: DraftStatus.sent, sentAt: new Date() } }),
        prisma.emailLog.create({
          data: {
            draftId: draft.id, campaignId, leadId: draft.leadId,
            gmailMessageId: msgId, trackingToken: token, status: EmailLogStatus.sent,
          },
        }),
        prisma.lead.update({ where: { id: draft.leadId }, data: { pipelineStage: PipelineStage.contacted } }),
        prisma.emailAccount.update({
          where: { id: campaign.emailAccount.id },
          data: { dailySent: { increment: 1 } },
        }),
      ]);

      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      await prisma.emailDraft.update({ where: { id: draft.id }, data: { status: DraftStatus.failed } });
    }
  }

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: CampaignStatus.done } });
}
