import { prisma } from "../../db";
import { callLLM } from "../groq";
import { enqueueJob } from "../queue";
import { TOOLS, TOOL_DESCRIPTIONS, ToolContext } from "./tools";
import { AgentStatus, AgentMode } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

const MAX_STEPS = 60;
const STEP_DELAY = 2; // seconds between agent iterations
const WAIT_DELAY = 5; // seconds while a search job is still processing
// ponytail: model is read from env so it can be swapped without code changes
const AGENT_MODEL = process.env.AGENT_MODEL || "mistral-large";

const SYSTEM_PROMPT = `You are LeadHunter's autonomous lead-generation agent. You take a high-level goal from the user and run the Search -> Enrich -> Score pipeline for them.

WORKFLOW:
1. Call create_search_job with a sensible businessType and geoQuery derived from the goal.
2. Poll get_search_status until status is "done" (it returns done:true). Each search enriches and scores leads automatically in the background.
3. Call list_leads (optionally filtered by websiteStatus:"no_website" and/or minScore) to pull the ranked results.
4. Call finish with a concise summary of what was found (counts, top leads, recommended next step).

OUTPUT FORMAT — respond with ONLY a JSON object, no markdown:
  {"thought":"<one sentence on what you're doing and why>","tool":"<tool name>","args":{...}}
Or to stop:
  {"thought":"<summary of outcome>","tool":"finish","args":{"summary":"<plain-text report for the user>"}}

AVAILABLE TOOLS:
${TOOL_DESCRIPTIONS}

RULES:
- Always pick the highest-intent leads (no_website first) when listing.
- Never invent tool args; only use the tools above.
- Keep thinking short and decisive.`;

function buildTranscript(runId: number, goal: string, steps: any[]): string {
  const lines = [`GOAL: ${goal}`, "", "CONVERSATION SO FAR:"];
  for (const s of steps) {
    if (s.kind === "thought") lines.push(`AGENT: ${s.content}`);
    else if (s.kind === "tool_result")
      lines.push(`TOOL RESULT: ${typeof s.content === "string" ? s.content : JSON.stringify(s.result)}`);
    else if (s.kind === "system") lines.push(`SYSTEM: ${s.content}`);
  }
  return lines.join("\n");
}

async function appendStep(runId: number, step: {
  kind: string; toolName?: string; content: string; args?: any; result?: any;
}) {
  const count = await prisma.agentStep.count({ where: { runId } });
  return prisma.agentStep.create({
    data: {
      runId,
      idx: count,
      kind: step.kind,
      toolName: step.toolName ?? null,
      content: step.content,
      args: step.args ?? undefined,
      result: step.result ?? undefined,
    },
  });
}

async function executeTool(tool: string, args: any, ctx: ToolContext) {
  const def = TOOLS[tool];
  return def.run(args, ctx);
}

async function scheduleNext(runId: number, delay: number) {
  await enqueueJob("agent_run", { runId }, delay);
}

export async function runAgentStep(runId: number): Promise<void> {
  const run = await prisma.agentRun.findUnique({ where: { id: runId }, include: { steps: true } });
  if (!run) return;
  if (["completed", "failed", "cancelled", "awaiting_approval"].includes(run.status)) return;

  if (run.status === "planning") {
    await prisma.agentRun.update({ where: { id: runId }, data: { status: "running" } });
  }
  if (run.stepCount >= MAX_STEPS) {
    await finishRun(runId, "Reached step limit; stopping the agent run.");
    return;
  }

  const ctx: ToolContext = { userId: run.userId, runId };
  const transcript = buildTranscript(runId, run.goal, run.steps);

  let parsed: any;
  try {
    const raw = await callLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: transcript,
      responseFormatJson: true,
      maxTokens: 500,
      temperature: 0.3,
      model: AGENT_MODEL,
      isAgent: true,
    });
    parsed = JSON.parse(raw);
  } catch (err: any) {
    await appendStep(runId, { kind: "system", content: `LLM/parse error: ${String(err?.message || err)}` });
    await finishRun(runId, "Agent stopped due to a model error. Please retry.");
    return;
  }

  const tool = parsed?.tool;
  const thought = String(parsed?.thought ?? "");
  const args = parsed?.args ?? {};

  if (tool === "finish" || !tool) {
    await appendStep(runId, { kind: "thought", content: thought });
    await finishRun(runId, parsed?.args?.summary ?? thought);
    return;
  }

  if (!TOOLS[tool]) {
    await appendStep(runId, {
      kind: "system",
      content: `Unknown tool "${tool}" requested. Asking the model to correct.`,
    });
    await scheduleNext(runId, STEP_DELAY);
    return;
  }

  await appendStep(runId, { kind: "thought", content: thought });
  await appendStep(runId, { kind: "tool_call", toolName: tool, content: `call ${tool}`, args });

  // Autonomy gate: plan_only must get explicit approval before state-changing tools.
  if (TOOLS[tool].requiresApproval && !run.approved && run.mode === "plan_only") {
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status: "awaiting_approval", pendingTool: { tool, args } },
    });
    await appendStep(runId, {
      kind: "approval",
      toolName: tool,
      content: `Plan-only mode: proposed action "${tool}" is awaiting your approval.`,
      args,
    });
    return;
  }

  let result: any;
  try {
    result = await executeTool(tool, args, ctx);
    await appendStep(runId, { kind: "tool_result", toolName: tool, content: JSON.stringify(result), result: result as any });
  } catch (err: any) {
    await appendStep(runId, {
      kind: "tool_result",
      toolName: tool,
      content: `Tool error: ${String(err?.message || err)}`,
    });
  }

  const waitMore = tool === "get_search_status" && result?.done === false;
  await scheduleNext(runId, waitMore ? WAIT_DELAY : STEP_DELAY);
}

export async function resumeRun(runId: number): Promise<void> {
  const run = await prisma.agentRun.findUnique({ where: { id: runId } });
  if (!run || run.status !== "awaiting_approval" || !run.pendingTool) return;

  const { tool, args } = run.pendingTool as any;
  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "running", approved: true, pendingTool: Prisma.JsonNull },
  });

  const ctx: ToolContext = { userId: run.userId, runId };
  try {
    const result = await executeTool(tool, args, ctx);
    await appendStep(runId, { kind: "tool_result", toolName: tool, content: JSON.stringify(result), result: result as any });
  } catch (err: any) {
    await appendStep(runId, { kind: "tool_result", toolName: tool, content: `Tool error: ${String(err?.message || err)}` });
  }

  await scheduleNext(runId, STEP_DELAY);
}

export async function cancelRun(runId: number): Promise<void> {
  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "cancelled", pendingTool: Prisma.JsonNull },
  });
}

export async function setMode(runId: number, mode: AgentMode): Promise<void> {
  const run = await prisma.agentRun.findUnique({ where: { id: runId } });
  if (!run) return;
  await prisma.agentRun.update({ where: { id: runId }, data: { mode } });
  // Switching away from plan_only while waiting on approval auto-approves.
  if (run.status === "awaiting_approval" && mode !== "plan_only") {
    await resumeRun(runId);
  }
}

async function finishRun(runId: number, summary: string): Promise<void> {
  const stepCount = await prisma.agentStep.count({ where: { runId } });
  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "completed", finalSummary: summary, stepCount },
  });
  await appendStep(runId, { kind: "summary", content: summary });
}
