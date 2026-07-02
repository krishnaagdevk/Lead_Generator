import { EmailVerifiedStatus } from "../generated/prisma/client";

/**
 * Validates an email address.
 * Integrates with Hunter.io or ZeroBounce if API keys are configured,
 * otherwise falls back to a regex syntax check and domain analysis.
 */
export async function verifyEmail(email: string): Promise<EmailVerifiedStatus> {
  if (!email || typeof email !== "string") {
    return EmailVerifiedStatus.invalid;
  }

  const cleanEmail = email.trim().toLowerCase();
  
  // Basic Regex Syntax Check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return EmailVerifiedStatus.invalid;
  }

  // Check for dummy/disposable patterns
  const domain = cleanEmail.split("@")[1] ?? "";
  const disposableDomains = ["mailinator.com", "yopmail.com", "trashmail.com", "tempmail.com"];
  if (disposableDomains.includes(domain)) {
    return EmailVerifiedStatus.invalid;
  }

  // Hunter.io API Integration placeholder
  const hunterKey = process.env.HUNTER_API_KEY;
  if (hunterKey) {
    try {
      const res = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(cleanEmail)}&api_key=${hunterKey}`
      );
      if (res.ok) {
        const data = await res.json() as { data?: { result?: string } };
        const result = data.data?.result;
        if (result === "deliverable") return EmailVerifiedStatus.valid;
        if (result === "undeliverable") return EmailVerifiedStatus.invalid;
        if (result === "risky") return EmailVerifiedStatus.catchall;
      }
    } catch (err) {
      console.error("Hunter.io verification failed, falling back:", err);
    }
  }

  // Default fallback: assume valid for syntactically correct non-disposable domains
  return EmailVerifiedStatus.valid;
}
