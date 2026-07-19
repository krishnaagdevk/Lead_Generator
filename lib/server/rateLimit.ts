import { prisma } from "../db";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Enforces a database-backed rate limit on a key (e.g. user_id or IP + route)
 * @param key Unique key for the rate limit
 * @param limit Max number of requests allowed in the window
 * @param windowMs Window duration in milliseconds (default 1 minute)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const now = new Date();

  // Prune expired rate limit entries in the DB to keep it clean
  await prisma.rateLimit.deleteMany({
    where: { windowEnd: { lt: now } },
  }).catch(() => {});

  const record = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!record) {
    const windowEnd = new Date(now.getTime() + windowMs);
    await prisma.rateLimit.create({
      data: {
        key,
        count: 1,
        windowEnd,
      },
    });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: windowEnd,
    };
  }

  if (record.windowEnd < now) {
    // Window expired, reset count and set new windowEnd
    const windowEnd = new Date(now.getTime() + windowMs);
    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: 1,
        windowEnd,
      },
    });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: windowEnd,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.windowEnd,
    };
  }

  // Increment count within the active window
  await prisma.rateLimit.update({
    where: { key },
    data: {
      count: { increment: 1 },
    },
  });

  return {
    success: true,
    limit,
    remaining: limit - record.count - 1,
    reset: record.windowEnd,
  };
}
