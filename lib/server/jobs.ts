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
  EmailVerifiedStatus,
  WarmupStatus,
} from "../generated/prisma/enums";
import { extractContactInfo } from "./crawler";
import { cityToLatLng, pointInPolygon } from "./geocoding";
import { sendGmail, decryptToken, checkReplyForMessage, getReplyMessageBodyAndDetails } from "./gmail";
import { generateDraft, analyzeReply } from "./groq";
import { fireWebhook } from "./webhook";
import { checkWebsite } from "./ping";
import { searchNearby, searchText, normalizePlace, getPlaceDetails } from "./places";
import { enqueueJob } from "./queue";
import { verifyEmail } from "./verification";
import { calculateScore } from "./scoring";

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

    const user = await prisma.user.findUnique({ where: { id: job.userId } });
    if (!user) return;



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

    const newPlacesRaw = rawPlaces.filter((p: any) => p.place_id && !existingIds.has(p.place_id));

    // Fetch place details in parallel for all newly discovered places
    const detailsPromises = newPlacesRaw.map(async (raw: any) => {
      const details = await getPlaceDetails(raw.place_id);
      return { ...raw, ...details };
    });

    const combinedPlaces = await Promise.all(detailsPromises);

    for (const raw of combinedPlaces) {
  
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


    // Fire webhook if enabled for this user
    if (user.webhookEnabled && user.webhookUrl) {
      fireWebhook(user.webhookUrl, "leads.created", {
        count: newLeads.length,
        leads: newLeads.map(l => ({ name: l.name, placeId: l.placeId })),
      }).catch(() => {});
    }

    await prisma.searchJob.update({
      where: { id: jobId },
      data: { 
        status: SearchStatus.done, 
        totalFound: count, 
        completedAt: new Date(),

      },
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
  } else if (updatedLead.email) {
    await enqueueJob("verify_email", { leadId });
  } else {
    await enqueueJob("calculate_score", { leadId });
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

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      email: info.email ?? lead.email,
      ...(Object.keys(info.socialLinks).length && { socialLinks: info.socialLinks }),
      ...(bestContact && { bestContact }),
    },
  });

  if (updatedLead.email) {
    await enqueueJob("verify_email", { leadId });
  } else {
    await enqueueJob("calculate_score", { leadId });
  }
}

// ── AI Drafts ─────────────────────────────────────────────────────────────────

export async function generateCampaignDrafts(campaignId: number): Promise<void> {
  const drafts = await prisma.emailDraft.findMany({
    where: { campaignId, status: DraftStatus.pending, editedByUser: false },
    include: { lead: true },
  });

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return;
  const user = await prisma.user.findUnique({ where: { id: campaign.userId } });
  if (!user) return;

  for (const draft of drafts) {
    try {
      const city = draft.lead.address?.split(",").slice(-2, -1)[0]?.trim() ?? "";
      const result = await generateDraft({
        name: draft.lead.name,
        category: draft.lead.category,
        city,
        websiteStatus: draft.lead.websiteStatus,
        rating: draft.lead.rating,
        reviewCount: draft.lead.reviewCount,
      }, {
        reviewPitchAngle: (draft.lead as any).reviewPitchAngle ?? undefined,
        calendlyUrl: user.calendlyUrl ?? undefined,
      });
      await prisma.emailDraft.update({
        where: { id: draft.id },
        data: { subject: result.subject, body: result.body },
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

  if (campaign.followUpDays && campaign.followUpCount === 0) {
    const delaySeconds = campaign.followUpDays * 24 * 60 * 60;
    await enqueueJob("send_follow_up", { campaignId }, delaySeconds);
  }
}

export async function verifyLeadEmail(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || !lead.email) {
    await enqueueJob("calculate_score", { leadId });
    return;
  }

  const verifiedStatus = await verifyEmail(lead.email);

  const isEmailValid = verifiedStatus === EmailVerifiedStatus.valid || verifiedStatus === EmailVerifiedStatus.catchall;
  const bestContact = isEmailValid
    ? BestContact.email
    : lead.phone
    ? BestContact.phone
    : lead.socialLinks
    ? BestContact.social
    : null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      emailVerifiedStatus: verifiedStatus,
      emailVerifiedAt: new Date(),
      ...(bestContact && { bestContact }),
    },
  });

  await enqueueJob("calculate_score", { leadId });
}

export async function calculateLeadScore(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const score = calculateScore(lead);

  await prisma.lead.update({
    where: { id: leadId },
    data: { leadScore: score },
  });
}

/** Enrich a lead's email using Hunter.io */
export async function enrichLead(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.email) return;

  const { findEmailForBusiness } = await import("./enrichment");
  const result = await findEmailForBusiness(lead.websiteUrl, lead.name);

  if (result.email) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        email: result.email,
        emailVerifiedStatus: "valid",
        enrichedAt: new Date(),
        enrichmentSource: "hunter",
        decisionMakerName: result.firstName && result.lastName
          ? `${result.firstName} ${result.lastName}`
          : undefined,
        decisionMakerTitle: result.position ?? undefined,
      },
    });
    await enqueueJob("calculate_score", { leadId });
  }
}

/** Check a lead's domain expiry using WHOIS */
export async function checkLeadDomainExpiry(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.websiteUrl) return;

  const { checkDomainExpiry } = await import("./domainChecker");
  const result = await checkDomainExpiry(lead.websiteUrl);
  if (!result) return;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      domainExpiryDate: result.expiryDate ?? undefined,
      domainExpiresInDays: result.daysUntilExpiry ?? undefined,
    },
  });
}

/** Analyze a lead's Google reviews for sentiment and pain points */
export async function analyzeLeadReviews(leadId: number): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const { getPlaceDetails } = await import("./places");
  const details = (await getPlaceDetails(lead.placeId)) as { reviews?: Array<{ text?: string; rating?: number }> } | null;
  const reviews = details?.reviews ?? [];

  if (!reviews || reviews.length === 0) return;

  const { analyzeReviews } = await import("./sentimentAnalysis");
  const sentiment = await analyzeReviews(lead.name, reviews.map((r: any) => ({ text: r.text, rating: r.rating })));
  if (!sentiment) return;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      reviewSentiment: sentiment.overallSentiment,
      reviewPainPoints: sentiment.topPainPoints,
      reviewPitchAngle: sentiment.pitchAngle,
    },
  });
}

/** Process all due sequence enrollments — send next step email */
export async function processSequences(): Promise<void> {
  const dueEnrollments = await prisma.sequenceEnrollment.findMany({
    where: { status: "active", nextSendAt: { lte: new Date() } },
    include: { lead: true, campaign: { include: { emailAccount: true } }, step: true },
    take: 50,
  });

  for (const enrollment of dueEnrollments) {
    try {
      const { lead, campaign, step } = enrollment;
      if (!step || !campaign.emailAccount || !lead.email) {
        await prisma.sequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: "failed" } });
        continue;
      }

      const personalizedSubject = step.subject
        .replace(/{{name}}/g, lead.name)
        .replace(/{{city}}/g, lead.address?.split(",")[1]?.trim() ?? "your area");
      const personalizedBody = step.body
        .replace(/{{name}}/g, lead.name)
        .replace(/{{city}}/g, lead.address?.split(",")[1]?.trim() ?? "your area");

      const tokenData = decryptToken(campaign.emailAccount.oauthTokenEncrypted);
      await sendGmail(tokenData, lead.email, personalizedSubject, personalizedBody);

      const nextStep = await prisma.sequenceStep.findFirst({
        where: { campaignId: enrollment.campaignId, stepNumber: enrollment.currentStep + 1 },
      });

      if (nextStep) {
        const nextSendAt = new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000);
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { currentStep: nextStep.stepNumber, stepId: nextStep.id, nextSendAt },
        });
      } else {
        await prisma.sequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: "completed" } });
      }
    } catch (err) {
      console.error(`Sequence enrollment ${enrollment.id} failed:`, err);
    }
  }

  const remaining = await prisma.sequenceEnrollment.count({ where: { status: "active" } });
  if (remaining > 0) {
    await enqueueJob("process_sequences", {}, 3600);
  }
}

/** Send weekly summary email to all users */
export async function sendWeeklySummary(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { parentId: null },
    select: { id: true, email: true },
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const user of users) {
    const [newLeads, emailsSent, replies, wonDeals] = await Promise.all([
      prisma.lead.count({ where: { userId: user.id, createdAt: { gte: oneWeekAgo } } }),
      prisma.emailLog.count({ where: { campaign: { userId: user.id }, sentAt: { gte: oneWeekAgo } } }),
      prisma.emailLog.count({ where: { campaign: { userId: user.id }, repliedAt: { gte: oneWeekAgo } } }),
      prisma.lead.count({ where: { userId: user.id, pipelineStage: "won", dealClosedAt: { gte: oneWeekAgo } } }),
    ]);

    const summaryHtml = `<h2>Your LeadHunter Weekly Summary</h2><ul>
      <li>📍 New leads discovered: <strong>${newLeads}</strong></li>
      <li>📧 Emails sent: <strong>${emailsSent}</strong></li>
      <li>💬 Replies received: <strong>${replies}</strong></li>
      <li>🏆 Deals won: <strong>${wonDeals}</strong></li>
    </ul>`;

    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn(`Skipping weekly summary for ${user.email} because RESEND_API_KEY is not set.`);
        continue;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "LeadHunter <noreply@leadhunter.app>",
          to: user.email,
          subject: "Your LeadHunter Weekly Summary",
          html: summaryHtml,
        }),
      });
      if (!res.ok) console.error(`Weekly summary fail for ${user.email}:`, await res.text());
    } catch (err) {
      console.error(`Error sending weekly summary to ${user.email}:`, err);
    }
  }
  await enqueueJob("weekly_summary", {}, 604800);
}

export async function checkAllCampaignReplies(): Promise<void> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const pendingLogs = await prisma.emailLog.findMany({
    where: {
      status: { in: [EmailLogStatus.sent, EmailLogStatus.opened] },
      sentAt: { gte: fourteenDaysAgo },
      gmailMessageId: { not: null },
    },
    include: {
      campaign: {
        include: { emailAccount: true, user: { select: { slackBotToken: true, slackChannelId: true } } },
      },
      lead: true,
    },
  });

  for (const log of pendingLogs) {
    if (!log.campaign.emailAccount || !log.gmailMessageId || !log.lead.email) continue;

    const tokenData = decryptToken(log.campaign.emailAccount.oauthTokenEncrypted);
    const replyDetails = await getReplyMessageBodyAndDetails(tokenData, log.gmailMessageId, log.lead.email);

    if (replyDetails) {
      let classification = "interested";
      let suggestedResponse = "";
      try {
        const analysis = await analyzeReply(replyDetails.body);
        classification = analysis.classification;
        suggestedResponse = analysis.suggestedResponse;
      } catch (e) {
        console.error("AI Reply Analysis failed:", e);
      }

       await prisma.$transaction([
         prisma.emailLog.update({
           where: { id: log.id },
           data: { 
             status: EmailLogStatus.replied, 
             repliedAt: new Date(),
             replyBody: replyDetails.body,
             replyClassification: classification,
             replySuggestedResponse: suggestedResponse,
           },
         }),
         prisma.lead.update({
           where: { id: log.leadId },
           data: { pipelineStage: PipelineStage.replied },
         }),
         // Stop sequence for this lead
         prisma.sequenceEnrollment.updateMany({
           where: { leadId: log.leadId, status: "active" },
           data: { status: "replied" },
         }),
       ]);
       
        // Send Slack notification (user-level tokens if configured, else global env vars)
        try {
          const { sendSlackReplyNotification } = await import("./slack");
          await sendSlackReplyNotification({
            leadName: log.lead.name,
            leadId: log.leadId,
            replyBody: replyDetails.body,
            classification: classification,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
            botToken: log.campaign.user.slackBotToken ?? undefined,
            channelId: log.campaign.user.slackChannelId ?? undefined,
          });
        } catch (err) {
          console.error("Failed to send Slack notification:", err);
        }
    }
  }

  // Re-enqueue next check in 60 seconds
  await enqueueJob("check_replies", {}, 60);
}

export async function sendFollowUpCampaign(campaignId: number): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { emailAccount: true },
  });
  if (!campaign || !campaign.emailAccount || !campaign.followUpDays) return;

  const logs = await prisma.emailLog.findMany({
    where: {
      campaignId,
      status: { in: [EmailLogStatus.sent, EmailLogStatus.opened] },
      lead: {
        pipelineStage: { in: [PipelineStage.contacted] },
      },
    },
    include: { lead: true },
  });

  const tokenData = decryptToken(campaign.emailAccount.oauthTokenEncrypted);

  for (const log of logs) {
    if (!log.lead.email) continue;

    const suppressed = await prisma.suppression.findFirst({
      where: { userId: campaign.userId, emailAddress: log.lead.email },
    });
    if (suppressed) continue;

    const account = await checkAndResetDailyLimit(campaign.emailAccount.id);
    if (!account) break;

    const effectiveLimit = await getEffectiveDailyLimit(account);
    if (account.dailySent >= effectiveLimit) break;

    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/${token}/open.png`;

      const subject = `Re: ${campaign.templateSubject}`;
      const body = `Hi ${log.lead.name},\n\nFollowing up on my previous email. Just wanted to see if you had a chance to read it and if you are interested in a new website or redesign for your business?\n\nBest regards,\n`;

      const msgId = await sendGmail(tokenData, log.lead.email, subject, body, pixelUrl);

      await prisma.$transaction([
        prisma.emailLog.create({
          data: {
            draftId: log.draftId, campaignId, leadId: log.leadId,
            gmailMessageId: msgId, trackingToken: token, status: EmailLogStatus.sent,
          },
        }),
        prisma.emailAccount.update({
          where: { id: campaign.emailAccount.id },
          data: { dailySent: { increment: 1 } },
        }),
      ]);

      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error("Failed to send follow up to", log.lead.email, err);
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { followUpCount: { increment: 1 } },
  });
}

