import * as cheerio from "cheerio";

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const JUNK_EMAILS = ["example", "sentry", "test.", "email@", "domain@", "yourname", "bootstrap"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

async function fetchPage(url: string): Promise<string | null> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
  };

  const tryFetch = async (targetUrl: string) => {
    const res = await fetch(targetUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers,
    });
    if (!res.ok) return null;
    return await res.text();
  };

  try {
    return await tryFetch(url);
  } catch (err) {
    if (url.startsWith("https://")) {
      const httpUrl = url.replace("https://", "http://");
      try {
        return await tryFetch(httpUrl);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function cleanEmail(email: string): string | null {
  const cleaned = email.toLowerCase().trim();
  if (JUNK_EMAILS.some((j) => cleaned.includes(j))) return null;
  if (IMAGE_EXTENSIONS.some((ext) => cleaned.endsWith(ext))) return null;
  return cleaned;
}

export async function extractContactInfo(
  websiteUrl: string | null
): Promise<{ email: string | null; socialLinks: Record<string, string> }> {
  if (!websiteUrl) return { email: null, socialLinks: {} };

  const base = websiteUrl.startsWith("http") ? websiteUrl.replace(/\/$/, "") : `https://${websiteUrl}`;
  const emails = new Set<string>();
  const socials: Record<string, string> = {};
  const visited = new Set<string>();
  const toVisit: string[] = [];

  // 1. Fetch homepage first
  const homepageHtml = await fetchPage(base);
  visited.add(base);
  visited.add(`${base}/`);

  if (homepageHtml) {
    const $ = cheerio.load(homepageHtml);
    
    // Parse homepage content
    extractFromHtml(homepageHtml, $, emails, socials);

    // Extract links to other potential contact/about pages
    const pageLinks = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      // Ignore anchors and javascript/protocol paths
      if (href.startsWith("#") || href.toLowerCase().startsWith("javascript:") || href.toLowerCase().startsWith("tel:") || href.toLowerCase().startsWith("mailto:")) {
        return;
      }

      // Resolve relative links
      let absoluteUrl = href;
      if (!href.startsWith("http")) {
        const path = href.startsWith("/") ? href : `/${href}`;
        absoluteUrl = `${base}${path}`;
      } else {
        // Only crawl links that belong to the same website
        if (!absoluteUrl.toLowerCase().startsWith(base.toLowerCase())) {
          return;
        }
      }

      // Check if it looks like a contact or about page
      const lowerHref = href.toLowerCase();
      const isContactPattern = /contact|about|support|info|reach|help|us|location/i.test(lowerHref);
      const isContactText = /contact|about|support|info|reach|help|us/i.test($(el).text());
      
      if (isContactPattern || isContactText) {
        pageLinks.add(absoluteUrl);
      }
    });

    // Add up to 3 links discovered from homepage
    Array.from(pageLinks).slice(0, 3).forEach((link) => toVisit.push(link));
  }

  // Add default fallbacks to the queue if they weren't visited
  const defaultPaths = ["/contact", "/contact-us", "/about"];
  for (const path of defaultPaths) {
    const absolute = `${base}${path}`;
    if (!visited.has(absolute) && !visited.has(`${absolute}/`) && toVisit.length < 5) {
      toVisit.push(absolute);
    }
  }

  // 2. Crawl discovered pages (up to 4 pages total crawled including homepage)
  let pagesCrawledCount = 1; // homepage counts as 1
  for (const url of toVisit) {
    if (pagesCrawledCount >= 4) break;
    if (visited.has(url) || visited.has(`${url}/`)) continue;
    
    visited.add(url);
    visited.add(`${url}/`);
    
    const html = await fetchPage(url);
    if (!html) continue;

    pagesCrawledCount++;
    const $ = cheerio.load(html);
    extractFromHtml(html, $, emails, socials);
  }

  return { 
    email: emails.values().next().value ?? null, 
    socialLinks: socials 
  };
}

function extractFromHtml(
  html: string,
  $: cheerio.CheerioAPI,
  emails: Set<string>,
  socials: Record<string, string>
) {
  // 1. Extract emails from mailto links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      const email = href.replace(/^mailto:/i, "").trim().split("?")[0];
      const cleaned = cleanEmail(email);
      if (cleaned) emails.add(cleaned);
    }
  });

  // 2. Extract emails from raw HTML text (handles obfuscation or plain text emails)
  const textContent = $.text();
  const textMatches = textContent.match(EMAIL_RE) ?? [];
  textMatches.forEach((m) => {
    const cleaned = cleanEmail(m);
    if (cleaned) emails.add(cleaned);
  });

  // Also search raw HTML string for emails (useful for scripts, meta tags, config JSONs)
  const htmlMatches = html.match(EMAIL_RE) ?? [];
  htmlMatches.forEach((m) => {
    const cleaned = cleanEmail(m);
    if (cleaned) emails.add(cleaned);
  });

  // 3. Extract social media links from standard anchors
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;

    const lowerHref = href.toLowerCase();
    
    if (lowerHref.includes("facebook.com/") && !lowerHref.includes("sharer") && !lowerHref.includes("like.php")) {
      if (!socials.facebook) socials.facebook = href;
    }
    if (lowerHref.includes("instagram.com/") && !lowerHref.includes("p/")) {
      if (!socials.instagram) socials.instagram = href;
    }
    if (lowerHref.includes("twitter.com/") || lowerHref.includes("x.com/")) {
      if (!socials.twitter) socials.twitter = href;
    }
    if (lowerHref.includes("linkedin.com/company/") || lowerHref.includes("linkedin.com/in/")) {
      if (!socials.linkedin) socials.linkedin = href;
    }
    if (lowerHref.includes("youtube.com/") || lowerHref.includes("youtu.be/")) {
      if (!socials.youtube) socials.youtube = href;
    }
    if (lowerHref.includes("play.google.com/store/apps/details")) {
      if (!socials.playStore) socials.playStore = href;
    }
    if (lowerHref.includes("apps.apple.com/") && lowerHref.includes("/app/")) {
      if (!socials.appStore) socials.appStore = href;
    }
  });
}
