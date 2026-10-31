import * as cheerio from "cheerio";
import { prisma } from "../db";
import { WebsiteStatus, PipelineStage } from "../generated/prisma/enums";

export const JOB_ROLE_CATEGORIES = [
  {
    category: "Software Engineering",
    roles: [
      "Full Stack Engineer",
      "Frontend Engineer",
      "Backend Engineer",
      "React Developer",
      "Node.js Developer",
      "Python Developer",
      "Mobile Engineer",
    ],
  },
  {
    category: "Data & AI",
    roles: [
      "AI Engineer",
      "Machine Learning Engineer",
      "Data Engineer",
      "Data Scientist",
    ],
  },
  {
    category: "Cloud & DevOps",
    roles: [
      "DevOps Engineer",
      "Cloud Architect",
      "Site Reliability Engineer",
      "QA Automation Engineer",
    ],
  },
] as const;

export const POPULAR_TECH_ROLES = [
  "Full Stack Engineer",
  "React Developer",
  "Mobile Engineer",
  "AI Engineer",
  "Node.js Developer",
  "Backend Engineer",
  "DevOps Engineer",
  "Python Developer",
];

export interface DiscoveredStartup {
  id: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  source: "producthunt" | "hackernews" | "linkedin" | "unstop";
  sourceUrl?: string;
  authorOrMaker?: string;
  publishedAt: string;
  techStack: string[];
  isNoCode: boolean;
  hasMobileApp: boolean;
  techNeedScore: number;
  urgency: "Critical" | "High" | "Moderate" | "Low";
  signals: string[];
  pitchHook: string;
  suggestedServices: string[];
  hiringRole?: string;
  location?: string;
  experienceLevel?: string;
  extractedEmail?: string | null;
}

export interface StartupTechAnalysis {
  techStack: string[];
  isNoCode: boolean;
  hasMobileApp: boolean;
  techNeedScore: number;
  urgency: "Critical" | "High" | "Moderate" | "Low";
  signals: string[];
  pitchHook: string;
  suggestedServices: string[];
  extractedEmail?: string | null;
}

/**
 * Strips tracking query parameters, hashes, and session ids from scraped URLs.
 * (Directly resolves duplicate job errors observed in CRUD J).
 */
export function canonicalUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    // Strip common tracker params
    const strippedParams = [
      "trackingid",
      "refid",
      "trk",
      "position",
      "pageurl",
      "currentjobid",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (strippedParams.includes(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw.split("?")[0].replace(/\/$/, "");
  }
}

/**
 * Extracts experience requirements from job title or description prose.
 * (Adapted from CRUD J to eliminate unstated/mismatched experience errors).
 */
export function extractExperienceFromText(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  const rangeMatch = /(\d+)\s*(?:-|–|—|to)\s*(\d+)\s*(?:\+)?\s*(?:yrs|years|yr|yoe|year)/i.exec(lower);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]} Yrs`;

  const openMatch = /(\d+)\s*\+\s*(?:yrs|years|yr|yoe|year)/i.exec(lower);
  if (openMatch) return `${openMatch[1]}+ Yrs`;

  if (/\b(?:fresher|entry[\s-]level|junior|intern)\b/i.test(lower)) return "Junior / Entry";
  if (/\b(?:senior|sr\.|lead|principal|staff|architect)\b/i.test(lower)) return "Senior / Lead";

  return undefined;
}

/**
 * Validates keyword relevance. Eliminates third-party ad noise / unrelated listings.
 * (Directly resolves keyword noise error from CRUD J).
 */
export function isRelevantToKeyword(title: string, desc: string, keyword?: string): boolean {
  if (!keyword || !keyword.trim()) return true;
  const kwParts = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const combined = `${title} ${desc}`.toLowerCase();
  // Match if any significant word of the keyword is in title or description
  return kwParts.some((part) => combined.includes(part));
}

/**
 * Inspects a startup's landing page HTML to detect their tech stack
 * and determine their need for technical agency / dev capacity.
 */
export async function analyzeStartupTech(url: string, startupName: string): Promise<StartupTechAnalysis> {
  const stack: string[] = [];
  const signals: string[] = [];
  const services: string[] = [];
  let isNoCode = false;
  let hasMobileApp = false;
  let score = 55;
  let extractedEmail: string | null = null;

  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      const lowerHtml = html.toLowerCase();

      // Email detection
      const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) {
        const validEmails = emailMatches.filter(
          (e) => !e.includes("sentry") && !e.includes("example") && !e.endsWith(".png") && !e.endsWith(".svg")
        );
        if (validEmails.length > 0) {
          extractedEmail = validEmails[0].toLowerCase();
        }
      }

      // No-Code / Builder platforms (High opportunity for dev services)
      if (
        lowerHtml.includes("bubble.io") ||
        lowerHtml.includes("bubble-element") ||
        lowerHtml.includes("d1muf25xaso8hp.cloudfront.net")
      ) {
        stack.push("Bubble.io");
        isNoCode = true;
        signals.push("Built on Bubble.io (No-Code MVP) — High risk of scaling bottlenecks & database throttling");
        services.push("Migration to scalable full-stack (Next.js / Node / PostgreSQL)");
        score += 35;
      } else if (
        lowerHtml.includes("data-wf-site") ||
        lowerHtml.includes("webflow.com") ||
        lowerHtml.includes("assets.website-files.com")
      ) {
        stack.push("Webflow");
        isNoCode = true;
        signals.push("Front-end hosted on Webflow — Likely lacks custom backend logic or user portal");
        services.push("Custom Web App / Portal development & API integrations");
        score += 25;
      } else if (
        lowerHtml.includes("framer.com") ||
        lowerHtml.includes("__framer__") ||
        lowerHtml.includes("framerusercontent.com")
      ) {
        stack.push("Framer");
        isNoCode = true;
        signals.push("Built with Framer landing page builder — Core product may still need technical execution");
        services.push("Full-stack MVP development & complex dashboard engineering");
        score += 25;
      } else if (lowerHtml.includes("wp-content") || lowerHtml.includes("wp-includes")) {
        stack.push("WordPress");
        isNoCode = true;
        signals.push("Powered by WordPress — Potential speed/security vulnerability for a modern SaaS");
        services.push("Modern headless redesign or dedicated SaaS web app");
        score += 20;
      } else if (lowerHtml.includes("carrd.co")) {
        stack.push("Carrd");
        isNoCode = true;
        signals.push("Single-page Carrd placeholder — Early concept waiting for real engineering");
        services.push("Full MVP build from scratch");
        score += 35;
      }

      if (lowerHtml.includes("/_next/") || lowerHtml.includes("__next_data__")) {
        stack.push("Next.js");
      } else if (lowerHtml.includes("react")) {
        stack.push("React");
      }

      if (lowerHtml.includes("tailwind")) {
        stack.push("Tailwind CSS");
      }

      if (lowerHtml.includes("supabase.co")) {
        stack.push("Supabase");
      }
      if (lowerHtml.includes("firebaseio.com") || lowerHtml.includes("firebase")) {
        stack.push("Firebase");
      }
      if (lowerHtml.includes("stripe.com")) {
        stack.push("Stripe");
      }

      if (lowerHtml.includes("apps.apple.com") || lowerHtml.includes("play.google.com")) {
        hasMobileApp = true;
        stack.push("Mobile App Live");
      } else {
        signals.push(
          "No iOS or Android app found — High opportunity to offer cross-platform mobile app (Flutter / React Native)"
        );
        services.push("Mobile app development (iOS & Android)");
        score += 15;
      }

      if (signals.length === 0) {
        signals.push("Early-stage MVP launched — Rapid feature velocity needed to beat competitors");
        services.push("Dedicated engineering sprint & staff augmentation");
      }
    } else {
      signals.push("Website had slow response or redirect error — Opportunity for DevOps/Infra hardening");
      score += 10;
    }
  } catch {
    signals.push("Early landing page — Founders likely focused on validation, need dev partner");
    score += 10;
  }

  const finalScore = Math.min(98, Math.max(35, score));
  let urgency: "Critical" | "High" | "Moderate" | "Low" = "Moderate";
  if (finalScore >= 80) urgency = "Critical";
  else if (finalScore >= 65) urgency = "High";
  else if (finalScore >= 45) urgency = "Moderate";
  else urgency = "Low";

  let pitchHook = `Noticed ${startupName}'s launch. We offer tech-as-a-service / fractional dev capacity to help early teams ship faster.`;
  if (isNoCode) {
    pitchHook = `Congrats on launching ${startupName}! Noticed you're running on ${stack[0] || "a no-code builder"}. As traction picks up, no-code often hits scaling and logic limits. We help founders migrate smoothly to a scalable Next.js/Node stack without product downtime.`;
  } else if (!hasMobileApp) {
    pitchHook = `Loved the concept behind ${startupName}. Since you have web live but no companion mobile apps yet, we can build and launch your native iOS & Android apps in under 3 weeks.`;
  }

  return {
    techStack: stack.length > 0 ? stack : ["Custom Web"],
    isNoCode,
    hasMobileApp,
    techNeedScore: finalScore,
    urgency,
    signals,
    pitchHook,
    suggestedServices: services.length > 0 ? services : ["Full-Stack Dev", "Mobile App Development", "DevOps & Cloud"],
    extractedEmail,
  };
}

/**
 * Fetch newly launched products from Product Hunt's public RSS/Atom feed
 */
export async function fetchProductHuntStartups(query?: string, limit = 15): Promise<DiscoveredStartup[]> {
  const results: DiscoveredStartup[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://www.producthunt.com/feed", {
      signal: controller.signal,
      headers: { "User-Agent": "LeadHunter-Bot/2.0" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return results;
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const entries = $("entry").toArray();
    for (const el of entries) {
      if (results.length >= limit) break;
      const $el = $(el);
      const title = $el.find("title").text().trim();
      const rawLink = $el.find("link[rel='alternate']").attr("href") || "";
      const phLink = canonicalUrl(rawLink);
      const published = $el.find("published").text().trim() || new Date().toISOString();
      const contentHtml = $el.find("content").text();

      const descMatch = contentHtml.match(/<p>([\s\S]*?)<\/p>/i);
      const tagline = descMatch
        ? descMatch[1].replace(/<[^>]+>/g, "").trim()
        : "Newly launched product on Product Hunt";

      // Strict keyword relevance gating
      if (!isRelevantToKeyword(title, tagline, query)) {
        continue;
      }

      const analysis = await analyzeStartupTech(phLink, title);
      const uniqueId = `ph_${Buffer.from(`${title}_${phLink}`).toString("base64url").slice(0, 36)}`;

      results.push({
        id: uniqueId,
        name: title,
        tagline,
        websiteUrl: phLink,
        source: "producthunt",
        sourceUrl: phLink,
        publishedAt: published,
        ...analysis,
      });
    }
  } catch (err) {
    console.error("Error fetching Product Hunt feed (handled gracefully):", err);
  }

  return results;
}

/**
 * Fetch Show HN / startups from Hacker News Algolia API
 */
export async function fetchHackerNewsStartups(query = "Show HN", limit = 15): Promise<DiscoveredStartup[]> {
  const results: DiscoveredStartup[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://hn.algolia.com/api/v1/search?tags=show_hn&query=${encodeURIComponent(
      query
    )}&hitsPerPage=${limit * 2}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return results;

    const data = (await res.json()) as { hits?: any[] };
    const hits = data.hits || [];

    for (const h of hits) {
      if (results.length >= limit) break;
      const cleanTitle = (h.title || "").replace(/^Show HN:\s*/i, "").trim();
      const targetUrl = canonicalUrl(h.url || `https://news.ycombinator.com/item?id=${h.objectID}`);
      const tagline = h.story_text ? h.story_text.slice(0, 140) : `Show HN project by @${h.author}`;

      // Keyword relevance gating
      if (!isRelevantToKeyword(cleanTitle, tagline, query)) {
        continue;
      }

      const analysis = await analyzeStartupTech(targetUrl, cleanTitle);

      results.push({
        id: `hn_${h.objectID}`,
        name: cleanTitle,
        tagline,
        websiteUrl: targetUrl,
        source: "hackernews",
        sourceUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        authorOrMaker: h.author,
        publishedAt: h.created_at || new Date().toISOString(),
        ...analysis,
      });
    }
  } catch (err) {
    console.error("Error fetching Hacker News startups (handled gracefully):", err);
  }

  return results;
}

/**
 * Crawls companies actively hiring for technical roles on LinkedIn (Using CRUD J's guest endpoint).
 * Includes deduplication, URL parameter stripping, and keyword relevance gating.
 */
export async function fetchLinkedInHiringStartups(
  role = "Full Stack Engineer",
  location = "remote",
  limit = 15
): Promise<DiscoveredStartup[]> {
  const results: DiscoveredStartup[] = [];
  const seenCompanies = new Set<string>();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      role
    )}&location=${encodeURIComponent(location)}&start=0`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return results;
    const html = await res.text();
    const $ = cheerio.load(html);

    const cards = $("li").toArray();
    for (const el of cards) {
      if (results.length >= limit) break;
      const card = $(el);
      const title = card.find("h3.base-search-card__title").text().trim();
      const company = card.find("h4.base-search-card__subtitle").text().trim();
      const loc = card.find("span.job-search-card__location").text().trim() || location;
      const rawLink = card.find("a.base-card__full-link").attr("href") || "";
      const jobUrl = canonicalUrl(rawLink);
      const postedAt = card.find("time").attr("datetime") || new Date().toISOString();

      if (!title || !company) continue;

      // Deduplication by company name
      const compKey = company.toLowerCase().trim();
      if (seenCompanies.has(compKey)) continue;
      seenCompanies.add(compKey);

      // Relevance check: ensure the title actually relates to the requested role or tech
      if (!isRelevantToKeyword(title, "", role)) {
        continue;
      }

      const experienceLevel = extractExperienceFromText(title) || "All Experience Levels";
      const techNeedScore = 92; // Active tech job posting is the single highest intent signal
      const pitchHook = `Saw that ${company} is actively searching for a ${title} in ${loc}. Rather than losing 3+ months to hiring and ramp-up, our dedicated engineering team can plug into your backlog this week as an elastic extension.`;

      const jobIdMatch = jobUrl.match(/-(\d+)(?:\?|$)/);
      const uniqueId = jobIdMatch
        ? `li_${jobIdMatch[1]}`
        : `li_${Buffer.from(`${company}:${title}:${loc}:${jobUrl}`).toString("base64url").slice(0, 36)}`;

      results.push({
        id: uniqueId,
        name: company,
        tagline: `Actively hiring: "${title}" (${loc})`,
        websiteUrl: jobUrl,
        source: "linkedin",
        sourceUrl: jobUrl,
        authorOrMaker: company,
        publishedAt: postedAt,
        techStack: [title, experienceLevel, "Active Tech Hiring"],
        isNoCode: false,
        hasMobileApp: true,
        techNeedScore,
        urgency: "Critical",
        signals: [
          `Actively seeking "${title}" (${experienceLevel}) — Team has immediate engineering backlog & capacity bottleneck`,
          `Approved hiring budget available for development`,
          `High response rate opportunity for Tech-as-a-Service / contract augmentation`,
        ],
        pitchHook,
        suggestedServices: ["Dedicated Engineering Team", "Staff Augmentation", "Sprint Acceleration"],
        hiringRole: title,
        location: loc,
        experienceLevel,
      });
    }
  } catch (err) {
    console.error("Error fetching LinkedIn hiring startups (handled gracefully):", err);
  }

  return results;
}

/**
 * Crawls tech openings from Unstop with safe parsing and canonicalization
 */
export async function fetchUnstopHiringStartups(
  role = "Developer",
  limit = 15
): Promise<DiscoveredStartup[]> {
  const results: DiscoveredStartup[] = [];
  const seenCompanies = new Set<string>();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&search=${encodeURIComponent(
      role
    )}&per_page=${limit * 2}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return results;
    const json = (await res.json()) as { data?: { data?: any[] } };
    const items = json?.data?.data || [];

    for (const item of items) {
      if (results.length >= limit) break;
      const company = item.organisation?.name || "Tech Company";
      const title = item.title || "Developer";
      const loc = item.city || "Remote";
      const rawUrl = item.public_url ? `https://unstop.com/${item.public_url}` : "";
      const jobUrl = canonicalUrl(rawUrl);

      if (!title || !company) continue;

      // Deduplication
      const compKey = company.toLowerCase().trim();
      if (seenCompanies.has(compKey)) continue;
      seenCompanies.add(compKey);

      // Relevance gating
      if (!isRelevantToKeyword(title, "", role)) {
        continue;
      }

      const experienceLevel = extractExperienceFromText(title) || item.experience || "Tech Role";
      const techNeedScore = 88;
      const pitchHook = `Noticed ${company} is hiring for ${title}. We provide on-demand senior engineers and MVP acceleration to help tech teams hit their product deadlines faster.`;

      const unstopIdMatch = jobUrl.match(/-(\d+)(?:\?|$)/);
      const uniqueId = unstopIdMatch
        ? `un_${unstopIdMatch[1]}`
        : `un_${Buffer.from(`${company}:${title}:${jobUrl}`).toString("base64url").slice(0, 36)}`;

      results.push({
        id: uniqueId,
        name: company,
        tagline: `Opening for ${title} • ${item.salary || "Competitive Compensation"}`,
        websiteUrl: jobUrl,
        source: "unstop",
        sourceUrl: jobUrl,
        authorOrMaker: company,
        publishedAt: item.start_date || new Date().toISOString(),
        techStack: [title, experienceLevel],
        isNoCode: false,
        hasMobileApp: true,
        techNeedScore,
        urgency: "High",
        signals: [
          `Active opening: "${title}" (${experienceLevel})`,
          `Company is actively allocating budget towards tech talent`,
        ],
        pitchHook,
        suggestedServices: ["Elastic Dev Capacity", "Feature Delivery Sprints"],
        hiringRole: title,
        location: loc,
        experienceLevel,
      });
    }
  } catch (err) {
    console.error("Error fetching Unstop tech roles (handled gracefully):", err);
  }

  return results;
}

/**
 * Aggregates startups and hiring companies across sources using Promise.allSettled.
 * Guarantees that a timeout or error on one source NEVER fails the search!
 */
export async function discoverStartups({
  source = "all",
  query = "",
  location = "remote",
  role = "Full Stack Engineer",
  limit = 25,
}: {
  source?: "all" | "producthunt" | "hackernews" | "linkedin" | "unstop";
  query?: string;
  location?: string;
  role?: string;
  limit?: number;
}): Promise<DiscoveredStartup[]> {
  let list: DiscoveredStartup[] = [];
  const targetRole = query || role || "Full Stack Engineer";

  if (source === "producthunt") {
    list = await fetchProductHuntStartups(query, limit);
  } else if (source === "hackernews") {
    list = await fetchHackerNewsStartups(query || "Show HN", limit);
  } else if (source === "linkedin") {
    list = await fetchLinkedInHiringStartups(targetRole, location, limit);
  } else if (source === "unstop") {
    list = await fetchUnstopHiringStartups(targetRole, limit);
  } else {
    // Blended: Run all 3 concurrently with allSettled for rock-solid error tolerance
    const perSource = Math.ceil(limit / 3);
    const settlements = await Promise.allSettled([
      fetchLinkedInHiringStartups(targetRole, location, perSource),
      fetchProductHuntStartups(query, perSource),
      fetchHackerNewsStartups(query || "Show HN", perSource),
    ]);

    for (const s of settlements) {
      if (s.status === "fulfilled") {
        list.push(...s.value);
      }
    }
  }

  // Deduplicate by both unique ID and canonical websiteUrl across all sources
  const seenKeys = new Set<string>();
  const dedupedList: DiscoveredStartup[] = [];

  for (const item of list) {
    const idKey = item.id ? item.id.toLowerCase().trim() : "";
    const urlKey = item.websiteUrl ? item.websiteUrl.toLowerCase().trim() : "";

    if (idKey && seenKeys.has(idKey)) continue;
    if (urlKey && seenKeys.has(urlKey)) continue;

    if (idKey) seenKeys.add(idKey);
    if (urlKey) seenKeys.add(urlKey);
    dedupedList.push(item);
  }

  return dedupedList.sort((a, b) => b.techNeedScore - a.techNeedScore);
}

/**
 * Converts a discovered startup/hiring company directly into a Lead in the user's CRM pipeline
 */
export async function importStartupAsLead(startup: DiscoveredStartup, userId: number) {
  let job = await prisma.searchJob.findFirst({
    where: {
      userId,
      businessType: "Startup Hunter / Tech as a Service",
    },
  });

  if (!job) {
    job = await prisma.searchJob.create({
      data: {
        userId,
        businessType: "Startup Hunter / Tech as a Service",
        geoQuery: { mode: "global", source: startup.source },
      },
    });
  }

  const existing = await prisma.lead.findFirst({
    where: {
      userId,
      websiteUrl: startup.websiteUrl,
    },
  });

  if (existing) {
    return { ok: true, lead: existing, alreadyExisted: true };
  }

  const newLead = await prisma.lead.create({
    data: {
      userId,
      searchJobId: job.id,
      placeId: `startup:${startup.id}`,
      name: startup.name,
      category: startup.hiringRole ? `Hiring: ${startup.hiringRole}` : `Startup (${startup.source.toUpperCase()})`,
      address: startup.location || (startup.authorOrMaker ? `Maker: @${startup.authorOrMaker}` : "Global / Remote"),
      websiteUrl: startup.websiteUrl,
      websiteStatus: WebsiteStatus.live,
      leadScore: startup.techNeedScore,
      email: startup.extractedEmail || null,
      notes: `Source: ${startup.source.toUpperCase()}\nRole/MVP: ${startup.tagline}\nDetected Stack: ${startup.techStack.join(
        ", "
      )}\nPitch Hook: ${startup.pitchHook}`,
      reviewPitchAngle: startup.pitchHook,
      reviewPainPoints: startup.signals,
      pipelineStage: PipelineStage.new,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { usageLeads: { increment: 1 } },
  });

  return { ok: true, lead: newLead, alreadyExisted: false };
}

// ── Startup Saved Searches & Auto-Tracking Engine ──────────────────────────

export interface StartupSavedSearchData {
  type: "startup";
  query?: string;
  role: string;
  location: string;
  source: "all" | "producthunt" | "hackernews" | "linkedin" | "unstop";
  intervalHours: number; // e.g. 2 or 3 hours
  lastRunAt?: string;
  nextRunAt?: string;
  autoImport: boolean;
  totalImported: number;
  status: "active" | "paused";
}

/**
 * Creates a new Startup Saved Search and immediately runs the first sync to populate DB.
 */
export async function createStartupSavedSearch(
  userId: number,
  params: {
    name: string;
    role: string;
    query?: string;
    location?: string;
    source?: "all" | "producthunt" | "hackernews" | "linkedin" | "unstop";
    intervalHours?: number; // 2 or 3
    autoImport?: boolean;
  }
) {
  const intervalHours = params.intervalHours ?? 2;
  const now = new Date();
  const nextRun = new Date(now.getTime() + intervalHours * 3600 * 1000);

  const geoQuery: StartupSavedSearchData = {
    type: "startup",
    query: params.query || "",
    role: params.role,
    location: params.location || "remote",
    source: params.source || "all",
    intervalHours,
    lastRunAt: now.toISOString(),
    nextRunAt: nextRun.toISOString(),
    autoImport: params.autoImport ?? true,
    totalImported: 0,
    status: "active",
  };

  const saved = await prisma.savedSearch.create({
    data: {
      userId,
      name: params.name,
      businessType: `Startup Track: ${params.role}`,
      geoQuery: geoQuery as any,
    },
  });

  // Execute initial sync immediately so fresh results are saved in DB right away
  const execution = await executeStartupSavedSearch(saved.id, userId);

  return { savedSearch: saved, initialExecution: execution };
}

/**
 * Executes a saved search: runs discovery logic, saves new leads to DB, and updates nextRunAt.
 */
export async function executeStartupSavedSearch(savedSearchId: number, userId: number) {
  const search = await prisma.savedSearch.findFirst({
    where: { id: savedSearchId, userId },
  });

  if (!search) throw new Error("Saved search not found");
  const data = search.geoQuery as unknown as StartupSavedSearchData;
  if (!data || data.type !== "startup") {
    throw new Error("Not a startup saved search");
  }

  // Run discovery
  const results = await discoverStartups({
    source: data.source || "all",
    query: data.query || "",
    role: data.role || "Full Stack Engineer",
    location: data.location || "remote",
    limit: 30,
  });

  let newlyImported = 0;
  if (data.autoImport !== false) {
    for (const startup of results) {
      try {
        const imp = await importStartupAsLead(startup, userId);
        if (!imp.alreadyExisted) {
          newlyImported++;
        }
      } catch (err) {
        console.error("Error auto-importing startup lead:", err);
      }
    }
  }

  const now = new Date();
  const interval = data.intervalHours || 2;
  const nextRun = new Date(now.getTime() + interval * 3600 * 1000);

  const updatedData: StartupSavedSearchData = {
    ...data,
    lastRunAt: now.toISOString(),
    nextRunAt: nextRun.toISOString(),
    totalImported: (data.totalImported || 0) + newlyImported,
  };

  await prisma.savedSearch.update({
    where: { id: savedSearchId },
    data: { geoQuery: updatedData as any },
  });

  return {
    ok: true,
    savedSearchId,
    totalFound: results.length,
    newlyImported,
    lastRunAt: now.toISOString(),
    nextRunAt: nextRun.toISOString(),
  };
}

/**
 * Syncs any scheduled searches that are due (e.g. within 2 or 3 hours).
 */
export async function syncDueStartupSearches(userId: number) {
  const allSaved = await prisma.savedSearch.findMany({
    where: { userId },
  });

  const now = new Date();
  const dueSearches = allSaved.filter((s) => {
    const q = s.geoQuery as unknown as StartupSavedSearchData;
    if (!q || q.type !== "startup" || q.status === "paused") return false;
    if (!q.nextRunAt) return true;
    return new Date(q.nextRunAt) <= now;
  });

  const executionResults = [];
  for (const s of dueSearches) {
    try {
      const res = await executeStartupSavedSearch(s.id, userId);
      executionResults.push(res);
    } catch (err: any) {
      executionResults.push({ savedSearchId: s.id, error: err?.message });
    }
  }

  return { checkedCount: allSaved.length, executedCount: dueSearches.length, executionResults };
}

/**
 * Lists all startup saved searches for a user with their schedules and stats.
 */
export async function listStartupSavedSearches(userId: number) {
  const allSaved = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return allSaved.filter((s) => {
    const q = s.geoQuery as unknown as StartupSavedSearchData;
    return q && q.type === "startup";
  });
}

/**
 * Toggles status (active/paused) or updates interval of a saved search.
 */
export async function updateStartupSavedSearch(
  savedSearchId: number,
  userId: number,
  updates: { status?: "active" | "paused"; intervalHours?: number; autoImport?: boolean }
) {
  const search = await prisma.savedSearch.findFirst({
    where: { id: savedSearchId, userId },
  });

  if (!search) throw new Error("Saved search not found");
  const data = search.geoQuery as unknown as StartupSavedSearchData;

  const updatedData: StartupSavedSearchData = {
    ...data,
    ...(updates.status && { status: updates.status }),
    ...(updates.intervalHours && { intervalHours: updates.intervalHours }),
    ...(updates.autoImport !== undefined && { autoImport: updates.autoImport }),
  };

  return await prisma.savedSearch.update({
    where: { id: savedSearchId },
    data: { geoQuery: updatedData as any },
  });
}

