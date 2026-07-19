import { PLANS } from "../config/plans";

export async function checkLeadLimit(userId: number): Promise<{ allowed: boolean; current: number; max: number }> {
  const { prisma } = await import("../db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, plan: true, usageLeads: true, usageResetAt: true },
  });

  if (!user) return { allowed: false, current: 0, max: 0 };

  // Bypass for owner
  const ownerEmail = process.env.OWNER_EMAIL || "";
  if (ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase()) {
    return { allowed: true, current: user.usageLeads, max: 999999 };
  }

  // Reset monthly usage if past 30 days
  const now = new Date();
  const daysSinceReset = (now.getTime() - user.usageResetAt.getTime()) / (1000 * 60 * 60 * 24);
  let usageLeads = user.usageLeads;

  if (daysSinceReset >= 30) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        usageLeads: 0,
        usageAiCalls: 0,
        usageResetAt: now,
      },
    });
    usageLeads = 0;
  }

  const plan = PLANS[user.plan] || PLANS.free;
  const max = plan.limits.leads;

  return {
    allowed: usageLeads < max,
    current: usageLeads,
    max,
  };
}

export async function checkAiLimit(userId: number): Promise<{ allowed: boolean; current: number; max: number }> {
  const { prisma } = await import("../db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, plan: true, usageAiCalls: true, usageResetAt: true },
  });

  if (!user) return { allowed: false, current: 0, max: 0 };

  // Bypass for owner
  const ownerEmail = process.env.OWNER_EMAIL || "";
  if (ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase()) {
    return { allowed: true, current: user.usageAiCalls, max: 999999 };
  }

  // Reset monthly usage if past 30 days
  const now = new Date();
  const daysSinceReset = (now.getTime() - user.usageResetAt.getTime()) / (1000 * 60 * 60 * 24);
  let usageAiCalls = user.usageAiCalls;

  if (daysSinceReset >= 30) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        usageLeads: 0,
        usageAiCalls: 0,
        usageResetAt: now,
      },
    });
    usageAiCalls = 0;
  }

  const plan = PLANS[user.plan] || PLANS.free;
  const max = plan.limits.ai;

  return {
    allowed: usageAiCalls < max,
    current: usageAiCalls,
    max,
  };
}
