import Groq from "groq-sdk";

let _client: Groq | null = null;
function client(): Groq {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

const SYSTEM = `You are a cold email copywriter for web design agencies.
Write short, friendly, personalized cold emails to local businesses offering web design services.
Keep under 150 words. Include a clear CTA. No fluff.
Return ONLY valid JSON: {"subject": "...", "body": "..."}`;

interface LeadPromptInput {
  name: string;
  category?: string | null;
  city?: string;
  websiteStatus?: string;
  rating?: number | null;
  reviewCount?: number | null;
}

function buildPrompt(lead: LeadPromptInput) {
  const statusMsg =
    lead.websiteStatus === "no_website"
      ? "has no website at all"
      : lead.websiteStatus === "broken"
      ? "has a broken/offline website"
      : "could benefit from a better website";

  let reviewMsg = "";
  if (lead.rating !== undefined && lead.rating !== null && lead.rating > 0) {
    reviewMsg = ` They have a Google Maps rating of ${lead.rating}/5 stars from ${lead.reviewCount ?? 0} reviews. If the reviews are good (>=4.0), reference this positive feedback as a compliment. If reviews are low (<4.0) or missing, mention that a modern site will help build trust and improve reviews.`;
  } else {
    reviewMsg = ` They have no reviews on Google Maps yet. Mention that getting a modern online presence can help them attract their first reviews and build credibility.`;
  }

  return `Write a cold email for ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "their city"}. They ${statusMsg}.${reviewMsg} Offer professional web design services. Be specific to their industry.`;
}

export async function generateDraft(lead: LeadPromptInput): Promise<{ subject: string; body: string }> {
  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildPrompt(lead) },
    ],
    temperature: 0.8,
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message.content ?? "{}";
  const parsed = JSON.parse(content) as { subject?: string; body?: string };
  return {
    subject: parsed.subject ?? `Quick question about ${lead.name}'s website`,
    body: parsed.body ?? "",
  };
}

export async function analyzeReply(replyBody: string): Promise<{ classification: string; suggestedResponse: string }> {
  const ANALYZER_SYSTEM = `You are a sales assistant AI.
Analyze this reply from a local business to a cold email offering web design services.
Classify the intent into one of these: "interested", "not_interested", "unsubscribed", or "meeting_requested".
Then, write a polite, professional, conversion-oriented follow-up response suggesting next steps (or polite acknowledgment if they decline). Keep under 100 words.
Return ONLY valid JSON: {"classification": "...", "suggestedResponse": "..."}`;

  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: ANALYZER_SYSTEM },
      { role: "user", content: `Reply message body:\n"""\n${replyBody}\n"""` },
    ],
    temperature: 0.5,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message.content ?? "{}";
  const parsed = JSON.parse(content) as { classification?: string; suggestedResponse?: string };
  return {
    classification: parsed.classification ?? "interested",
    suggestedResponse: parsed.suggestedResponse ?? "",
  };
}
