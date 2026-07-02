import * as cheerio from "cheerio";

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /facebook\.com\/[A-Za-z0-9._\-/]+/,
  instagram: /instagram\.com\/[A-Za-z0-9._\-/]+/,
  playStore: /play\.google\.com\/store\/apps\/details\?[A-Za-z0-9._\-&=%]+/,
  appStore: /apps\.apple\.com\/([a-z]{2}\/)?app\/([A-Za-z0-9\-]+\/)?id[0-9]+/,
};
const CONTACT_PATHS = ["/contact", "/contact-us", "/about", ""];
const JUNK_EMAILS = ["example", "sentry", "test.", "email@", "domain@", "yourname"];

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadHunter/1.0)" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function extractContactInfo(
  websiteUrl: string | null
): Promise<{ email: string | null; socialLinks: Record<string, string> }> {
  if (!websiteUrl) return { email: null, socialLinks: {} };

  const base = websiteUrl.startsWith("http") ? websiteUrl.replace(/\/$/, "") : `https://${websiteUrl}`;
  const emails = new Set<string>();
  const socials: Record<string, string> = {};

  for (const path of CONTACT_PATHS) {
    const text = await fetchPage(`${base}${path}`);
    if (!text) continue;

    const $ = cheerio.load(text);
    const content = $.text();

    const found = content.match(EMAIL_RE) ?? [];
    found.forEach((e) => {
      if (!JUNK_EMAILS.some((j) => e.toLowerCase().includes(j))) {
        emails.add(e.toLowerCase());
      }
    });

    for (const [platform, pat] of Object.entries(SOCIAL_PATTERNS)) {
      if (!socials[platform]) {
        const match = text.match(pat);
        if (match) socials[platform] = `https://${match[0]}`;
      }
    }
  }

  return { email: emails.values().next().value ?? null, socialLinks: socials };
}
