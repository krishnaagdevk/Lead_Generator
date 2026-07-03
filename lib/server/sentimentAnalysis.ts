import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ReviewSentiment {
  overallSentiment: "positive" | "mixed" | "negative";
  topPainPoints: string[];    // e.g. ["website is hard to find", "no online booking"]
  pitchAngle: string;         // e.g. "A professional website with online booking could double their bookings."
}

export async function analyzeReviews(
  businessName: string,
  reviews: Array<{ text: string; rating: number }>
): Promise<ReviewSentiment | null> {
  if (!reviews.length) return null;

  const reviewsText = reviews.slice(0, 10).map(r => `[${r.rating}★] ${r.text}`).join("\n");

  const res = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You analyze Google reviews for local businesses. Extract pain points and suggest a web design pitch angle.
Return ONLY valid JSON: {"overallSentiment": "positive|mixed|negative", "topPainPoints": ["...", "..."], "pitchAngle": "..."}`
      },
      {
        role: "user",
        content: `Business: ${businessName}\nReviews:\n${reviewsText}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
    temperature: 0.4,
  });

  try {
    return JSON.parse(res.choices[0]?.message.content ?? "{}") as ReviewSentiment;
  } catch {
    return null;
  }
}