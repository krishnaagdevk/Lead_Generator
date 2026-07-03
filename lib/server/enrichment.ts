import axios from "axios";

export interface EnrichmentResult {
  email: string | null;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  linkedInUrl?: string;
  decisionMakerName?: string;
  decisionMakerTitle?: string;
}

/** Extract domain from website URL or business name. */
function extractDomain(websiteUrl?: string | null, businessName?: string): string | null {
  if (websiteUrl) {
    try {
      return new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`).hostname.replace(/^www\./, "");
    } catch {}
  }
  if (businessName) {
    return businessName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".com";
  }
  return null;
}

/** Use Hunter.io to find an email for a given business domain. */
export async function findEmailForBusiness(
  websiteUrl: string | null,
  businessName: string | null
): Promise<EnrichmentResult> {
  const domain = extractDomain(websiteUrl, businessName ?? undefined);
  if (!domain || !process.env.HUNTER_API_KEY) return { email: null };

  try {
    const res = await axios.get("https://api.hunter.io/v2/domain-search", {
      params: {
        domain,
        api_key: process.env.HUNTER_API_KEY,
        limit: 3,
        type: "personal",
      },
      timeout: 8000,
    });

    const data = res.data?.data;
    if (!data?.emails?.length) return { email: null };

    // Prefer owner/CEO/founder emails
    const priority = ["owner", "ceo", "founder", "director", "manager"];
    let best = data.emails[0];
    for (const p of priority) {
      const found = data.emails.find((e: any) => e.position?.toLowerCase().includes(p));
      if (found) { best = found; break; }
    }

    return {
      email: best.value,
      firstName: best.first_name,
      lastName: best.last_name,
      position: best.position,
      confidence: best.confidence,
    };
  } catch (err) {
    console.error("Hunter.io enrichment error:", err);
    return { email: null };
  }
}