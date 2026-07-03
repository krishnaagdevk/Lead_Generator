import { execSync } from "child_process";

export interface DomainExpiry {
  domain: string;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean; // within 90 days
}

export async function checkDomainExpiry(websiteUrl: string | null): Promise<DomainExpiry | null> {
  if (!websiteUrl) return null;

  let domain: string;
  try {
    domain = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  try {
    // Use WHOIS HTTP API (no npm package needed — free tier)
    const res = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env.WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json() as any;
    const expiryStr = data?.WhoisRecord?.registryData?.expiresDate;
    if (!expiryStr) return { domain, expiryDate: null, daysUntilExpiry: null, isExpiringSoon: false };

    const expiryDate = new Date(expiryStr);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      domain,
      expiryDate,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 90,
    };
  } catch (err) {
    console.error("Domain expiry check error:", err);
    return null;
  }
}