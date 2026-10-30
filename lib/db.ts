import dns from "node:dns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { startQueueWorker } from "./server/queue";

// Fallback DNS resolver for cloud DBs (e.g. Neon) when local ISP / USB tethering DNS rejects *.neon.tech lookups
if (typeof window === "undefined" && !(global as any).__dnsPatched) {
  (global as any).__dnsPatched = true;
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);
  const origLookup = dns.lookup;
  dns.lookup = function (hostname, options: any, callback: any) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (hostname && (hostname.includes("neon.tech") || hostname.includes("aws.neon.tech"))) {
      resolver.resolve4(hostname, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
          if (options && options.all) {
            return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
          }
          return callback(null, addresses[0], 4);
        }
        return origLookup(hostname, options, callback);
      });
      return;
    }
    return origLookup(hostname, options, callback);
  } as typeof dns.lookup;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Automatically start background worker in Node.js server environment
if (typeof window === "undefined") {
  startQueueWorker();
}
