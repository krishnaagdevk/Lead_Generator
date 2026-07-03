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

function buildPrompt(lead: LeadPromptInput, options?: { reviewPitchAngle?: string; calendlyUrl?: string }) {
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

  let prompt = `Write a cold email for ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "their city"}. They ${statusMsg}.${reviewMsg}`;
  
  if (options?.reviewPitchAngle) {
    prompt += ` Key insight from their reviews: ${options.reviewPitchAngle}`;
  }
  
  prompt += ` Offer professional web design services. Be specific to their industry.`;
  
  if (options?.calendlyUrl) {
    prompt += ` Include the booking link ${options.calendlyUrl} in your email signature so they can schedule a call with you.`;
  }
  
  return prompt;
}

export async function generateDraft(lead: LeadPromptInput, options?: { reviewPitchAngle?: string; calendlyUrl?: string }): Promise<{ subject: string; body: string }> {
  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildPrompt(lead, options) },
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

export async function generateCallScript(lead: {
  name: string;
  category?: string | null;
  city?: string;
  websiteStatus?: string;
}): Promise<{ opening: string; pitch: string; objectionHandling: string; cta: string }> {
  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You write short cold call scripts for web designers targeting local businesses.
Return ONLY valid JSON: {
  "opening": "Hi, may I speak with the owner? ...",
  "pitch": "I noticed your business ...",
  "objectionHandling": "If they say they already have a site: ...",
  "cta": "Would you be open to a quick 10-minute call this week?"
}`
      },
      {
        role: "user",
        content: `Business: ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "your area"}. Website status: ${lead.websiteStatus ?? "unknown"}.`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 400,
    temperature: 0.7,
  });

  return JSON.parse(res.choices[0]?.message.content ?? "{}");
}

export async function generatePitch(lead: {
  name: string;
  category?: string | null;
  city?: string;
  websiteStatus?: string;
  rating?: number | null;
  reviewPainPoints?: string[];
  reviewPitchAngle?: string | null;
}): Promise<{ headline: string; problem: string; solution: string; proof: string; pricing: string; cta: string }> {
  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You write professional sales proposals for web designers targeting local businesses.
Return ONLY valid JSON: { "headline": "...", "problem": "...", "solution": "...", "proof": "...", "pricing": "...", "cta": "..." }`
      },
      {
        role: "user",
        content: `Business: ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "local area"}.
Website status: ${lead.websiteStatus}.
${lead.rating ? `Rating: ${lead.rating}/5 stars.` : "No rating yet."}
${lead.reviewPainPoints?.length ? `Customer pain points: ${lead.reviewPainPoints.join(", ")}` : ""}
${lead.reviewPitchAngle ? `Key insight: ${lead.reviewPitchAngle}` : ""}
Write a full sales proposal with a compelling headline, problem statement, solution pitch, social proof section, suggested pricing (web design $1,000–$5,000 range), and a clear call to action.`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 800,
    temperature: 0.7,
  });

  return JSON.parse(res.choices[0]?.message.content ?? "{}");
}

export async function rankSubjectLines(
  subjects: string[],
  businessContext: string
): Promise<Array<{ subject: string; rank: number; reason: string }>> {
  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You are an email marketing expert. Rank these cold email subject lines from best to worst for a web design outreach campaign.
Return ONLY valid JSON: [{"subject": "...", "rank": 1, "reason": "..."}, ...]`
      },
      {
        role: "user",
        content: `Subject lines:\n${subjects.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nContext: ${businessContext}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
    temperature: 0.3,
  });

  const content = res.choices[0]?.message.content ?? "[]";
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.subjects ?? [];
}

export async function analyzeTone(subject: string, body: string): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  verdict: "good" | "needs_work" | "poor";
}> {
  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You are an email copywriting expert. Analyze this cold email draft for quality, tone, and persuasiveness.
Return ONLY valid JSON: {"score": 75, "issues": ["..."], "suggestions": ["..."], "verdict": "needs_work"}`
      },
      { role: "user", content: `Subject: ${subject}\n\nBody:\n${body}` }
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
    temperature: 0.3,
  });
  return JSON.parse(res.choices[0]?.message.content ?? "{}");
}

export async function checkSpamScore(subject: string, body: string): Promise<{
  score: number;
  flags: string[];
  suggestions: string[];
}> {
  const SPAM_SIGNALS = [
    "ALL CAPS words", "Excessive exclamation marks", "Spam trigger words (FREE, GUARANTEED, CLICK HERE, ACT NOW)",
    "No unsubscribe link", "Too many links", "Short subject line", "Deceptive subject lines",
  ];

  const res = await client().chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You are an email deliverability expert. Analyze this email for spam filter signals.
Known spam signals: ${SPAM_SIGNALS.join(", ")}.
Return ONLY valid JSON: {"score": 25, "flags": ["..."], "suggestions": ["..."]}`
      },
      { role: "user", content: `Subject: ${subject}\n\nBody:\n${body}` }
    ],
    response_format: { type: "json_object" },
    max_tokens: 250,
    temperature: 0.2,
  });
  return JSON.parse(res.choices[0]?.message.content ?? "{}");
}