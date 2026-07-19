import { prisma } from "../../db";
import { enqueueJob } from "../queue";
import { checkLeadLimit } from "../planLimits";
import { SearchStatus, WebsiteStatus } from "../../generated/prisma/enums";

export interface ToolContext {
  userId: number;
  runId: number;
}

export interface Tool {
  name: string;
  description: string;
  parameters: string;
  requiresApproval: boolean;
  run: (args: any, ctx: ToolContext) => Promise<unknown>;
}

function isGeoQuery(v: any): boolean {
  return (
    v &&
    typeof v === "object" &&
    typeof v.mode === "string" &&
    ["radius", "polygon", "city", "multi_city"].includes(v.mode)
  );
}

export const TOOLS: Record<string, Tool> = {
  create_search_job: {
    name: "create_search_job",
    description:
      'Create and launch a lead search job for a business type + geographic area. Returns the new jobId. geoQuery examples: {"mode":"city","city":"Austin, TX","country":"US"}, {"mode":"radius","lat":30.26,"lng":-97.74,"radius_km":5}, {"mode":"multi_city","cities":["Austin","Dallas"],"country":"US"}.',
    parameters: "businessType: string, geoQuery: object",
    requiresApproval: true,
    async run(args, ctx) {
      const businessType = String(args.businessType ?? "").trim();
      if (!businessType) throw new Error("businessType is required");
      if (!isGeoQuery(args.geoQuery)) throw new Error("valid geoQuery is required");

      const limit = await checkLeadLimit(ctx.userId);
      if (!limit.allowed) {
        return { ok: false, error: "Lead limit reached — upgrade plan to search." };
      }

      const job = await prisma.searchJob.create({
        data: { userId: ctx.userId, businessType, geoQuery: args.geoQuery },
      });
      await enqueueJob("search", { jobId: job.id });
      return { ok: true, jobId: job.id, status: job.status };
    },
  },

  get_search_status: {
    name: "get_search_status",
    description:
      "Check the progress of a search job: status (queued|running|done|failed), totalFound leads, and how many are still being processed.",
    parameters: "jobId: number",
    requiresApproval: false,
    async run(args) {
      const job = await prisma.searchJob.findUnique({
        where: { id: Number(args.jobId) },
        select: {
          id: true,
          status: true,
          totalFound: true,
          error: true,
          leads: { select: { websiteStatus: true, leadScore: true } },
        },
      });
      if (!job) return { ok: false, error: "job not found" };

      const pending = job.leads.filter(
        (l: any) => l.websiteStatus === WebsiteStatus.unknown
      ).length;
      const scored = job.leads.filter((l: any) => l.leadScore > 0).length;
      return {
        ok: true,
        jobId: job.id,
        status: job.status,
        totalFound: job.totalFound,
        pendingEnrichment: pending,
        scored,
        error: job.error ?? null,
        done: job.status === SearchStatus.done,
      };
    },
  },

  list_leads: {
    name: "list_leads",
    description:
      "List the discovered leads for a search job, ranked by lead score. Optional filters: minScore (0-100), websiteStatus (no_website|broken|live), limit (default 25).",
    parameters: "jobId: number, minScore?: number, websiteStatus?: string, limit?: number",
    requiresApproval: false,
    async run(args) {
      const where: any = { searchJobId: Number(args.jobId) };
      if (args.minScore != null) where.leadScore = { gte: Number(args.minScore) };
      if (args.websiteStatus) where.websiteStatus = args.websiteStatus;

      const leads = await prisma.lead.findMany({
        where,
        orderBy: { leadScore: "desc" },
        take: Number(args.limit ?? 25),
        select: {
          id: true,
          name: true,
          category: true,
          address: true,
          websiteStatus: true,
          leadScore: true,
          phone: true,
          email: true,
          bestContact: true,
        },
      });
      return { ok: true, count: leads.length, leads };
    },
  },
};

export const TOOL_DESCRIPTIONS = Object.values(TOOLS)
  .map((t) => `- ${t.name}(${t.parameters}): ${t.description}`)
  .join("\n");
