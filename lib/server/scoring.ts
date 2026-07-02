import { WebsiteStatus, EmailVerifiedStatus, Lead } from "../generated/prisma/client";

/**
 * Computes a priority score (0 to 100) for a lead.
 * 
 * Score Formula:
 * - Website Status (max 40 pts):
 *   - no_website: 40 pts (needs a new site)
 *   - broken: 30 pts (needs repairs/redesign)
 *   - live: 10 pts (needs optimizations/SEO)
 *   - unknown: 0 pts
 * - Contact Info (max 30 pts):
 *   - Verified email (valid/catchall): 15 pts
 *   - Phone number: 10 pts
 *   - Social links: 5 pts
 * - Ratings & Online Presence (max 30 pts):
 *   - Rating is < 3.8 or null: 15 pts (needs reputation management)
 *   - Review count is < 10 or null: 15 pts (needs review generation)
 */
export function calculateScore(lead: Partial<Lead> & { socialLinks?: any }): number {
  let score = 0;

  // 1. Website Status (Max 40)
  if (lead.websiteStatus === WebsiteStatus.no_website) {
    score += 40;
  } else if (lead.websiteStatus === WebsiteStatus.broken) {
    score += 30;
  } else if (lead.websiteStatus === WebsiteStatus.live) {
    score += 10;
  }

  // 2. Contact Info (Max 30)
  if (lead.email && lead.emailVerifiedStatus && (lead.emailVerifiedStatus === EmailVerifiedStatus.valid || lead.emailVerifiedStatus === EmailVerifiedStatus.catchall)) {
    score += 15;
  }
  if (lead.phone) {
    score += 10;
  }
  if (lead.socialLinks && typeof lead.socialLinks === "object") {
    const keys = Object.keys(lead.socialLinks);
    if (keys.length > 0) {
      score += 5;
    }
  }

  // 3. Online Presence & Reputation (Max 30)
  const rating = lead.rating ?? null;
  if (rating === null || rating < 3.8) {
    score += 15;
  }
  
  const reviews = lead.reviewCount ?? null;
  if (reviews === null || reviews < 10) {
    score += 15;
  }

  return Math.min(Math.max(score, 0), 100);
}
