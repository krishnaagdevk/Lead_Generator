import { callLLM } from "./groq";

export interface ReviewSentiment {
  overallSentiment: "positive" | "mixed" | "negative";
  topPainPoints: string[];    // e.g. ["website is hard to find", "no online booking"]
  pitchAngle: string;         // e.g. "A professional website with online booking could double their bookings."
}

const REVIEWS_SENTIMENT_SYSTEM = `You are an elite, Senior AI & Lead Analytics Engineer.
Your task is to perform a high-fidelity sentiment and firmographic audit on customer reviews for a local business to discover conversion gaps and high-leverage pain points.

CRITICAL ANALYSIS CRITERIA:
1. SENTIMENT CLASSIFICATION: Accurately categorize the "overallSentiment" as either:
   - "positive": mostly 4-5 stars with praise.
   - "mixed": a combination of good and bad points, or mostly 3 stars.
   - "negative": mostly 1-2 stars with complaints or high friction.
2. TACTICAL PAIN POINTS: Extract up to 3 highly specific customer-experience pain points (e.g., "no online booking option", "website has outdated contact details", "impossible to find directions online", "slow phone response"). Avoid generic platitudes.
3. THE STRATEGIC PITCH ANGLE: Formulate a compelling, revenue-focused web design or reputation marketing pitch angle tailored specifically to this business's review insights. Explain how a modern website or review funnel will resolve these issues.
4. CLEAN RESPONSE FORMAT: Return ONLY a valid, parseable JSON object matching this schema:
{
  "overallSentiment": "positive" | "mixed" | "negative",
  "topPainPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
  "pitchAngle": "The strategic pitch angle suggestion."
}

Do not include any markdown wrapper, intro, or explanation outside of the raw JSON.`;

export async function analyzeReviews(
  businessName: string,
  reviews: Array<{ text: string; rating: number }>
): Promise<ReviewSentiment | null> {
  if (!reviews.length) return null;

  const reviewsText = reviews
    .slice(0, 10)
    .map((r) => `[${r.rating}★] ${r.text}`)
    .join("\n");

  try {
    const content = await callLLM({
      systemPrompt: REVIEWS_SENTIMENT_SYSTEM,
      userPrompt: `Business Name: ${businessName}\nReviews:\n${reviewsText}`,
      responseFormatJson: true,
      maxTokens: 200,
      temperature: 0.4,
    });

    return JSON.parse(content ?? "{}") as ReviewSentiment;
  } catch (err) {
    console.error("[Sentiment Analysis] Failed to analyze reviews via callLLM:", err);
    return null;
  }
}