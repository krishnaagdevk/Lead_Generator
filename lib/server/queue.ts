import { prisma } from "../db";

const globalForWorker = global as unknown as { workerStarted?: boolean };

async function runTask(taskType: string, payload: any): Promise<void> {
  const { runSearchJob, pingLead, crawlLead, generateCampaignDrafts, sendCampaign, verifyLeadEmail, calculateLeadScore } = await import("./jobs");
  switch (taskType) {
    case "search":
      await runSearchJob(payload.jobId);
      break;
    case "ping":
      await pingLead(payload.leadId);
      break;
    case "crawl":
      await crawlLead(payload.leadId);
      break;
    case "verify_email":
      await verifyLeadEmail(payload.leadId);
      break;
    case "calculate_score":
      await calculateLeadScore(payload.leadId);
      break;
    case "ai_draft":
      await generateCampaignDrafts(payload.campaignId);
      break;
    case "send":
      await sendCampaign(payload.campaignId);
      break;
    case "send_follow_up":
      const { sendFollowUpCampaign } = await import("./jobs");
      await sendFollowUpCampaign(payload.campaignId);
      break;
    case "check_replies":
      const { checkAllCampaignReplies } = await import("./jobs");
      await checkAllCampaignReplies();
      break;
    case "enrich_lead":
      const { enrichLead } = await import("./jobs");
      await enrichLead(payload.leadId);
      break;
    case "check_domain_expiry":
      const { checkLeadDomainExpiry } = await import("./jobs");
      await checkLeadDomainExpiry(payload.leadId);
      break;
    case "analyze_reviews":
      const { analyzeLeadReviews } = await import("./jobs");
      await analyzeLeadReviews(payload.leadId);
      break;
    case "process_sequences":
      const { processSequences } = await import("./jobs");
      await processSequences();
      break;
    case "weekly_summary":
      const { sendWeeklySummary } = await import("./jobs");
      await sendWeeklySummary();
      break;
    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }
}

export async function processNextJob(): Promise<boolean> {
  try {
    // Atomically find, lock, and update the next ready job in one query
    const updatedJobs = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "JobQueue"
       SET status = 'running',
           "startedAt" = NOW(),
           attempts = attempts + 1
       WHERE id = (
         SELECT id
         FROM "JobQueue"
         WHERE status = 'pending'
           AND "runAt" <= NOW()
         ORDER BY "runAt" ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );

    const job = updatedJobs?.[0] || null;

    if (!job) return false;

    console.log(`Processing background job #${job.id} (${job.taskType})...`);

    try {
      await runTask(job.taskType, job.payload);

      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: "completed",
          finishedAt: new Date(),
        },
      });
      console.log(`Completed background job #${job.id}`);
    } catch (error: any) {
      console.error(`Failed background job #${job.id}:`, error);

      const isRetryable = job.attempts < job.maxAttempts;
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: isRetryable ? "pending" : "failed",
          error: error?.message || String(error),
          finishedAt: new Date(),
          // Backoff delay: 15 seconds * number of attempts
          ...(isRetryable && { runAt: new Date(Date.now() + 15000 * job.attempts) }),
        },
      });
    }

    return true;
  } catch (err) {
    console.error("Error in processNextJob:", err);
    return false;
  }
}

export async function enqueueJob(taskType: string, payload: any, delaySeconds = 0): Promise<number> {
  const runAt = new Date(Date.now() + delaySeconds * 1000);
  const job = await prisma.jobQueue.create({
    data: {
      taskType,
      payload: payload as any,
      runAt,
      status: "pending",
    },
  });

  // Trigger immediate processing in the background
  if (delaySeconds === 0) {
    processNextJob().catch(() => {});
  }

  return job.id;
}

export function startQueueWorker() {
  if (globalForWorker.workerStarted) return;
  if (process.env.NEXT_RUNTIME === "edge") return; // Edge runtime is serverless and cannot run background loops
  globalForWorker.workerStarted = true;

  console.log("Initializing database-backed queue worker...");

  // Start periodic reply checking
  prisma.jobQueue.findFirst({
    where: { taskType: "check_replies", status: "pending" }
  }).then(exists => {
    if (!exists) {
      enqueueJob("check_replies", {}, 10).catch(() => {});
    }
  });
  
  // Seed weekly summary job
  prisma.jobQueue.findFirst({
    where: { taskType: "weekly_summary", status: "pending" }
  }).then(exists => {
    if (!exists) {
      enqueueJob("weekly_summary", {}, 0).catch(() => {}); // First run immediately
    }
  });

  async function tick() {
    try {
      let processed = false;
      do {
        processed = await processNextJob();
      } while (processed);
    } catch (err) {
      console.error("Worker tick error:", err);
    } finally {
      setTimeout(tick, 3000); // Check again in 3 seconds
    }
  }

  tick();
}
