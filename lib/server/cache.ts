import { prisma } from "../db";

const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function getPlacesCache(key: string): Promise<unknown | null> {
  try {
    const entry = await prisma.placesCache.findUnique({
      where: { key },
    });

    if (!entry) return null;

    if (new Date() > entry.expiresAt) {
      // Clean up expired entry in background
      prisma.placesCache.delete({ where: { key } }).catch(() => {});
      return null;
    }

    return entry.response;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

export async function setPlacesCache(key: string, response: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.placesCache.upsert({
      where: { key },
      update: {
        response: response as any,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        key,
        response: response as any,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

/**
 * Prunes all expired cache entries from the database.
 */
export async function pruneExpiredCache(): Promise<void> {
  try {
    await prisma.placesCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  } catch (error) {
    console.error("Cache prune error:", error);
  }
}
