export type WebsiteStatus = "no_website" | "broken" | "live" | "unknown";

export async function checkWebsite(url: string | null): Promise<WebsiteStatus> {
  if (!url) return "no_website";

  const normalized = url.startsWith("http") ? url : `https://${url}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadHunter/1.0)" },
    });
    clearTimeout(timer);
    return res.status < 400 ? "live" : "broken";
  } catch {
    // Try GET if HEAD failed
    try {
      const res2 = await fetch(normalized, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadHunter/1.0)" },
      });
      clearTimeout(timer);
      return res2.status < 400 ? "live" : "broken";
    } catch {
      clearTimeout(timer);
      return "broken";
    }
  }
}
