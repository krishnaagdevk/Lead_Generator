import Groq from "groq-sdk";

// ── Nararouter API Keys Registry ──────────────────────────────────────────────
// This list is loaded from process.env.NARA_ROUTER_KEYS or falls back to our embedded list.
const NARA_KEYS = process.env.NARA_ROUTER_KEYS
  ? process.env.NARA_ROUTER_KEYS.split(",").map(k => k.trim())
  : [
      "sk-nry-nHtC5GDc9HAJQKpT0ph-YzWQ0rVhgfhi8SiWR6aIOe0", // goldyagarwal81@gmail.com
      "sk-nry-vyzy2_hH680jV_S0s6uIu1h0IgbuFUwUqcqiccxtyOw", // keertidevk@gmail.com
      "sk-nry-n5ZSv4nWD6BGXlhiDwXtqWQDhJ_nl94eafFXBtqYaUQ", // agarwalgunjan1983@gmail.com
      "sk-nry-hFl9kZQKkvGaqrxtPG7L-6IkbvaEapc3pZoz1a6TiC0", // sunderlalagarwal1953@gmail.com
      "sk-nry-3lmWjZADZwC6STpSoSlde_hyoYSMV34xOHT12EnuN7A", // agarwalkeerti57@gmail.com
      "sk-nry-Vm_2eYuzVgyFfEzGifu4POR4B2Fm17oLGUgSS9LUig8"  // learningnailartbykeerti@gmail.com
    ];

// ── Premium B2B System Prompts ────────────────────────────────────────────────

const EMAIL_COPYWRITING_SYSTEM = `You are a world-class, premium Cold Email Copywriter and Conversion Rate Optimization (CRO) expert.
Your goal is to write hyper-personalized, high-converting, and friendly outbound cold emails to local businesses from a professional web design and SEO agency.

CRITICAL INSTRUCTIONS FOR OUTSTANDING COPYWRITING:
1. PERSUASIVE SIMPLICITY: Keep the email crisp, short (under 130 words), and conversational. Avoid all corporate jargon, cliché opening lines (like "I hope this email finds you well"), or pushy sales pitches.
2. EMPATHY-DRIVEN HOOK: Open with a genuine compliment or localized context. Never sound like an automated bot.
3. THE "PROBLEM-SOLUTION" GAP: Clearly bridge the gap between their current web status (e.g. no site, broken site, or missing review trust markers) and their direct revenue potential. Focus on solving their customer-acquisition pain points.
4. SINGULAR CLEAR CTA: Close with a low-friction, zero-pressure Call to Action (e.g. asking for a 5-minute chat or sending a quick custom video review).
5. CLEAN RESPONSE FORMAT: You must return ONLY a valid, parseable JSON object matching this schema:
{
  "subject": "The email subject line (engaging, short, and personalized)",
  "body": "The complete personalized email body text, incorporating conversational spacing."
}

Do not include any markdown wrapper, intro, or explanation outside of the raw JSON.`;

const REPLY_ANALYZER_SYSTEM = `You are an elite, senior Sales Operations Assistant.
Your task is to analyze an incoming reply from a local business who was pitched web design or SEO services, classify their sentiment with extreme accuracy, and draft a tailored follow-up to progress the deal.

CLASSIFICATION RULES:
1. "interested": The lead is asking for more details, pricing, portfolio, or showing positive curiosity.
2. "meeting_requested": The lead is explicitly proposing a phone call, meeting, or asking for a calendar link.
3. "not_interested": The lead politely or firmly declines the offer.
4. "unsubscribed": The lead is demanding to be removed, complaining, or using stop words.

REPLY COPYWRITING INSTRUCTIONS:
- If interested or meeting requested: Draft a polite, helpful, and highly professional response aiming to lock in a slot or answer their questions. Keep it under 80 words.
- If not interested: Write a short, warm, and highly respectful 1-sentence acknowledgment thanking them for their time. Leave the door open for future collaboration.
- If unsubscribed: Provide a brief, polite, and standard opt-out confirmation.

JSON RESPONSE SCHEMA:
{
  "classification": "interested" | "meeting_requested" | "not_interested" | "unsubscribed",
  "suggestedResponse": "The customized professional response text."
}

Return ONLY valid JSON.`;

const CALL_SCRIPT_SYSTEM = `You are an expert cold-calling sales coach specializing in B2B local business outreach.
Your task is to write a highly conversational, punchy, and rejection-proof cold calling script for a web designer trying to reach the business decision-maker.

SCRIPT CRITERIA:
1. "opening": Direct, polite, and designed to bypass the gatekeeper with natural confidence. Avoid overly polished "salesperson" energy.
2. "pitch": A 2-sentence hook highlighting a specific visible issue with their current site or review profile and explaining the immediate cash-flow benefit of fixing it.
3. "objectionHandling": Tactical, smooth responses to the most common local business objection: "We already have a website" or "We aren't interested."
4. "cta": A frictionless, low-pressure request for a brief, 10-minute visual screen share.

JSON RESPONSE SCHEMA:
{
  "opening": "Opening line...",
  "pitch": "Elevator pitch hook...",
  "objectionHandling": "Handling common objections...",
  "cta": "Frictionless CTA..."
}

Return ONLY valid JSON.`;

const SALES_PROPOSAL_SYSTEM = `You are an elite B2B Enterprise Proposals Architect.
Your task is to draft a highly compelling, personalized sales proposal showing a local business exactly how a modern web presence and reputation optimization will boost their top-line revenue.

PROPOSAL SECTIONS:
1. "headline": An attention-grabbing, localized hook focusing on value rather than technical deliverables.
2. "problem": A crystal-clear, objective breakdown of their current online gap (e.g. broken site, negative review patterns, missing booking funnels).
3. "solution": A premium, highly tailored remedy that promises to streamline their customer journey and double conversion rates.
4. "proof": A short, punchy sentence establishing social proof or trust benchmarks.
5. "pricing": A clean, transparent pricing structure (suggesting professional package prices in the range of $1,000–$5,000).
6. "cta": A clear, action-oriented next step to schedule a discovery call.

JSON RESPONSE SCHEMA:
{
  "headline": "...",
  "problem": "...",
  "solution": "...",
  "proof": "...",
  "pricing": "...",
  "cta": "..."
}

Return ONLY valid JSON.`;

const SUBJECT_RANKER_SYSTEM = `You are a high-performance email deliverability and open-rate optimization expert.
Your job is to evaluate alternative email subject choices, rank them by open potential, and write a concise, metrics-driven reason for each ranking.

EVALUATION CRITERIA:
- High performance is awarded to short, localized, curiosity-inducing, or helpful subjects (e.g., "London agency site error").
- Penalize excessive clickbait, all-caps, or spam-trigger words.
- Sort them in ascending order starting from Rank #1 (best).

JSON RESPONSE SCHEMA:
[
  {
    "subject": "The evaluated subject text",
    "rank": 1,
    "reason": "Clear value-based metric explanation."
  }
]

Return ONLY valid JSON array.`;

const TONE_ANALYZER_SYSTEM = `You are an elite B2B copy editor and conversion reviewer.
Your job is to audit a cold email draft's tone, pacing, clarity, and persuasive metrics.

AUDIT BENCHMARKS:
- Give high scores (80-100) if the draft is concise, direct, helpful, and has conversational formatting.
- Penalize drafts that are overly salesy, use block paragraphs, or open with generic clichés.
- Provide actionable improvement points and alternative suggestions.

JSON RESPONSE SCHEMA:
{
  "score": 85,
  "issues": ["List of precise problems found..."],
  "suggestions": ["Actionable phrasing fixes..."],
  "verdict": "good" | "needs_work" | "poor"
}

Return ONLY valid JSON.`;

const SPAM_ANALYZER_SYSTEM = `You are an expert on email deliverability, email filters, and anti-spam algorithms.
Your job is to analyze an email draft and flag elements that could trigger spam filters (e.g., excessive exclamation marks, spam trigger phrases, all-caps words, or a high ratio of pitch-heavy text).

JSON RESPONSE SCHEMA:
{
  "score": 15,
  "flags": ["List of triggered deliverability flags..."],
  "suggestions": ["Specific recommendations to clean up the content and pass filters..."]
}

Return ONLY valid JSON.`;

// ── Model Selection Mapping Helper ───────────────────────────────────────────

export function resolveModels(requestedModel?: string): { naraModel: string; groqModel: string } {
  const NARA_MODELS = process.env.NARA_MODELS
    ? process.env.NARA_MODELS.split(",").map(m => m.trim())
    : ["mimo-v2.5-free", "mistral-large", "mistral-medium-3-5", "tencent-hy3"];
  const GROQ_MODELS = process.env.GROQ_MODELS
    ? process.env.GROQ_MODELS.split(",").map(m => m.trim())
    : [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b"
      ];

  let naraModel = "mistral-large";
  let groqModel = "llama-3.3-70b-versatile";

  if (requestedModel) {
    if (NARA_MODELS.includes(requestedModel)) {
      naraModel = requestedModel;
      if (requestedModel === "mimo-v2.5-free") {
        groqModel = "llama-3.1-8b-instant";
      } else if (requestedModel === "mistral-medium-3-5") {
        groqModel = "llama-3.3-70b-versatile";
      } else if (requestedModel === "tencent-hy3") {
        groqModel = "llama-3.3-70b-versatile";
      } else {
        groqModel = "llama-3.3-70b-versatile";
      }
    } else if (GROQ_MODELS.includes(requestedModel)) {
      groqModel = requestedModel;
      naraModel = "mistral-large"; // Fallback gateway model if calling NaraRouter first
    } else {
      naraModel = requestedModel;
      groqModel = requestedModel;
    }
  }

  return { naraModel, groqModel };
}

// ── Unified, Fault-Tolerant AI Routing Client ─────────────────────────────────

export async function callLLM({
  systemPrompt,
  userPrompt,
  responseFormatJson = false,
  maxTokens = 400,
  temperature = 0.7,
  model,
  isAgent = false,
}: {
  systemPrompt: string;
  userPrompt: string;
  responseFormatJson?: boolean;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  isAgent?: boolean;
}): Promise<string> {
  const { naraModel } = resolveModels(model);
  const naraRouterBaseUrl = process.env.NARA_ROUTER_URL || "https://router.naraya.ai/v1";

  // Iterate through NaraRouter rotating API Keys
  for (let i = 0; i < NARA_KEYS.length; i++) {
    const key = NARA_KEYS[i];
    console.log(`[LLM Router] Attempting NaraRouter API call (Key #${i + 1}/${NARA_KEYS.length}, Model: ${naraModel})...`);
    
    try {
      const response = await fetch(`${naraRouterBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: naraModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature,
          ...(responseFormatJson && { response_format: { type: "json_object" } }),
        }),
        signal: AbortSignal.timeout(10000), // 10-second strict fail-fast timeout per key
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          console.log(`[LLM Router] Succeeded via NaraRouter Key #${i + 1}!`);
          return text;
        }
      } else {
        const errText = await response.text();
        console.warn(`[LLM Router] NaraRouter Key #${i + 1} failed (Status ${response.status}): ${errText}`);
      }
    } catch (err: any) {
      console.warn(`[LLM Router] NaraRouter Key #${i + 1} threw exception: ${err.message || String(err)}`);
    }
  }

  throw new Error("[LLM Router] Total service outage: All NaraRouter keys failed. No other fallback providers are configured.");
}

// ── Refactored Copywriting & Analysis Endpoints ───────────────────────────────

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

export async function generateDraft(
  lead: LeadPromptInput, 
  options?: { reviewPitchAngle?: string; calendlyUrl?: string; model?: string }
): Promise<{ subject: string; body: string }> {
  try {
    const content = await callLLM({
      systemPrompt: EMAIL_COPYWRITING_SYSTEM,
      userPrompt: buildPrompt(lead, options),
      responseFormatJson: true,
      maxTokens: 400,
      temperature: 0.8,
      model: options?.model,
    });

    const parsed = JSON.parse(content) as { subject?: string; body?: string };
    return {
      subject: parsed.subject ?? `Quick question about ${lead.name}'s website`,
      body: parsed.body ?? "",
    };
  } catch (err) {
    console.error("Failed to generate draft, returning fallback subject/body:", err);
    return {
      subject: `Quick question about ${lead.name}'s website`,
      body: `Hi,\n\nI tried visiting your website but noticed some areas we could help you improve. Let's schedule a call!`,
    };
  }
}

export async function analyzeReply(replyBody: string): Promise<{ classification: string; suggestedResponse: string }> {
  try {
    const content = await callLLM({
      systemPrompt: REPLY_ANALYZER_SYSTEM,
      userPrompt: `Reply message body:\n"""\n${replyBody}\n"""`,
      responseFormatJson: true,
      maxTokens: 300,
      temperature: 0.5,
    });

    const parsed = JSON.parse(content) as { classification?: string; suggestedResponse?: string };
    return {
      classification: parsed.classification ?? "interested",
      suggestedResponse: parsed.suggestedResponse ?? "",
    };
  } catch {
    return {
      classification: "interested",
      suggestedResponse: "Thank you for your reply! Let me check on that and get back to you.",
    };
  }
}

export async function generateCallScript(
  lead: {
    name: string;
    category?: string | null;
    city?: string;
    websiteStatus?: string;
  },
  model?: string
): Promise<{ opening: string; pitch: string; objectionHandling: string; cta: string }> {
  const content = await callLLM({
    systemPrompt: CALL_SCRIPT_SYSTEM,
    userPrompt: `Business: ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "your area"}. Website status: ${lead.websiteStatus ?? "unknown"}.`,
    responseFormatJson: true,
    maxTokens: 400,
    temperature: 0.7,
    model,
  });

  return JSON.parse(content);
}

export async function generatePitch(
  lead: {
    name: string;
    category?: string | null;
    city?: string;
    websiteStatus?: string;
    rating?: number | null;
    reviewPainPoints?: string[];
    reviewPitchAngle?: string | null;
  },
  model?: string
): Promise<{ headline: string; problem: string; solution: string; proof: string; pricing: string; cta: string }> {
  const content = await callLLM({
    systemPrompt: SALES_PROPOSAL_SYSTEM,
    userPrompt: `Business: ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "local area"}.
Website status: ${lead.websiteStatus}.
${lead.rating ? `Rating: ${lead.rating}/5 stars.` : "No rating yet."}
${lead.reviewPainPoints?.length ? `Customer pain points: ${lead.reviewPainPoints.join(", ")}` : ""}
${lead.reviewPitchAngle ? `Key insight: ${lead.reviewPitchAngle}` : ""}
Write a full sales proposal.`,
    responseFormatJson: true,
    maxTokens: 800,
    temperature: 0.7,
    model,
  });

  return JSON.parse(content);
}

export async function rankSubjectLines(
  subjects: string[],
  businessContext: string
): Promise<Array<{ subject: string; rank: number; reason: string }>> {
  try {
    const content = await callLLM({
      systemPrompt: SUBJECT_RANKER_SYSTEM,
      userPrompt: `Subject lines:\n${subjects.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nContext: ${businessContext}`,
      responseFormatJson: true,
      maxTokens: 300,
      temperature: 0.3,
    });

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.subjects ?? [];
  } catch {
    return subjects.map((s, i) => ({ subject: s, rank: i + 1, reason: "Unable to evaluate dynamically." }));
  }
}

export async function analyzeTone(subject: string, body: string): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  verdict: "good" | "needs_work" | "poor";
}> {
  try {
    const content = await callLLM({
      systemPrompt: TONE_ANALYZER_SYSTEM,
      userPrompt: `Subject: ${subject}\n\nBody:\n${body}`,
      responseFormatJson: true,
      maxTokens: 150,
      temperature: 0.3,
    });
    return JSON.parse(content);
  } catch {
    return { score: 70, issues: ["Failed to connect to analyzer"], suggestions: [], verdict: "needs_work" };
  }
}

export async function checkSpamScore(subject: string, body: string): Promise<{
  score: number;
  flags: string[];
  suggestions: string[];
}> {
  try {
    const content = await callLLM({
      systemPrompt: SPAM_ANALYZER_SYSTEM,
      userPrompt: `Subject: ${subject}\n\nBody:\n${body}`,
      responseFormatJson: true,
      maxTokens: 150,
      temperature: 0.2,
    });
    return JSON.parse(content);
  } catch {
    return { score: 10, flags: ["Spam checker connectivity error"], suggestions: [] };
  }
}

// ── Website Mockup Generation prompt and function ─────────────────────────────────

const WEBSITE_MOCKUP_SYSTEM = `You are a world-class front-end designer, copywriter, and UX strategist.
Your task is to generate a highly convincing, beautifully structured, and interactive mockup specification for a local business that does not have a website (or has a broken one).
The student developer will show this mockup to the business owner on a mobile phone or tablet to pitch their web/app design services.

Make the mockup extremely specific to their business, industry, and location.

Return ONLY a valid, parseable JSON object matching this schema:
{
  "colors": {
    "primary": "Tailwind color class or CSS hex code",
    "secondary": "Tailwind color class or CSS hex code",
    "background": "Tailwind color class or CSS hex code",
    "accent": "Tailwind color class or CSS hex code"
  },
  "hero": {
    "title": "A highly punchy, attention-grabbing header (e.g. 'Crafting London\\'s Finest Artisan Pizzas')",
    "subtitle": "A persuasive value proposition subtitle targeting local customers (e.g. 'Fresh hand-stretched sourdough pizzas baked in wood-fired ovens. Ordered online, delivered piping hot to your door.')",
    "ctaText": "An action-oriented button text (e.g. 'Order Online', 'Book Appointment', 'See Services')"
  },
  "features": [
    { "title": "Feature 1 Title", "desc": "1-sentence short feature description", "icon": "Lucide icon name (e.g., Sparkles, Shield, Clock, Heart, Award, Star)" },
    { "title": "Feature 2 Title", "desc": "1-sentence description", "icon": "Lucide icon name" },
    { "title": "Feature 3 Title", "desc": "1-sentence description", "icon": "Lucide icon name" }
  ],
  "services": [
    { "name": "Service/Product 1 Name", "price": "Realistic price or range (e.g. $15 or $45-$60)", "desc": "Quick enticing description" },
    { "name": "Service/Product 2 Name", "price": "Realistic price", "desc": "Quick enticing description" },
    { "name": "Service/Product 3 Name", "price": "Realistic price", "desc": "Quick enticing description" }
  ],
  "about": "A warm, localized, and narrative-driven 'About Us' section explaining why this business is the pride of their community, mentioning their neighborhood and high review ratings if applicable."
}

Do not include any explanation or markdown wraps. Only raw JSON.`;

export async function generateMockup(
  lead: {
    name: string;
    category?: string | null;
    city?: string;
    websiteStatus?: string;
    rating?: number | null;
    reviewCount?: number | null;
  },
  model?: string
): Promise<{
  colors: { primary: string; secondary: string; background: string; accent: string };
  hero: { title: string; subtitle: string; ctaText: string };
  features: Array<{ title: string; desc: string; icon: string }>;
  services: Array<{ name: string; price: string; desc: string }>;
  about: string;
}> {
  const content = await callLLM({
    systemPrompt: WEBSITE_MOCKUP_SYSTEM,
    userPrompt: `Business: ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "local neighborhood"}.
Website status: ${lead.websiteStatus ?? "no website"}.
Rating: ${lead.rating ? `${lead.rating}/5 stars from ${lead.reviewCount ?? 0} reviews.` : "No reviews yet."}
Generate an outstanding mockup layout tailored precisely for them.`,
    responseFormatJson: true,
    maxTokens: 1000,
    temperature: 0.7,
    model,
  });

  return JSON.parse(content);
}