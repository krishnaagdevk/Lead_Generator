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

function buildPrompt(lead: { name: string; category?: string | null; city?: string; websiteStatus?: string }) {
  const statusMsg =
    lead.websiteStatus === "no_website"
      ? "has no website at all"
      : lead.websiteStatus === "broken"
      ? "has a broken/offline website"
      : "could benefit from a better website";

  return `Write a cold email for ${lead.name}, a ${lead.category ?? "local business"} in ${lead.city ?? "their city"}. They ${statusMsg}. Offer professional web design services. Be specific to their industry.`;
}

export async function generateDraft(lead: {
  name: string;
  category?: string | null;
  city?: string;
  websiteStatus?: string;
}): Promise<{ subject: string; body: string }> {
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
