"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Check, X, Play, Loader2, Sparkles, AlertTriangle } from "lucide-react";

type Mode = "plan_only" | "hitl" | "autonomous";
type Status =
  | "planning"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

interface Step {
  idx: number;
  kind: string;
  toolName?: string | null;
  content: string;
  args?: any;
  result?: any;
  createdAt: string;
}
interface Run {
  id: number;
  goal: string;
  mode: Mode;
  status: Status;
  finalSummary?: string | null;
  stepCount: number;
  createdAt: string;
  steps?: Step[];
  pendingTool?: any;
}

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "plan_only", label: "Plan only", hint: "Agent drafts a plan and waits for your approval before acting." },
  { id: "hitl", label: "Human-in-the-loop", hint: "Agent runs search/enrich/score, pauses before sending." },
  { id: "autonomous", label: "Autonomous", hint: "Agent runs the full pipeline end-to-end without stopping." },
];

const STATUS_STYLE: Record<Status, string> = {
  planning: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-700",
  awaiting_approval: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const KIND_STYLE: Record<string, string> = {
  thought: "border-l-gray-300 bg-gray-50",
  tool_call: "border-l-blue-400 bg-blue-50",
  tool_result: "border-l-green-400 bg-green-50",
  approval: "border-l-amber-400 bg-amber-50",
  system: "border-l-amber-300 bg-amber-50",
  summary: "border-l-primary bg-primary/5",
};

const KIND_ICON: Record<string, any> = {
  thought: Sparkles,
  tool_call: Play,
  tool_result: Check,
  approval: AlertTriangle,
  system: AlertTriangle,
  summary: Bot,
};

export default function AgentPage() {
  const [goal, setGoal] = useState("Find restaurants in Austin, TX without a website");
  const [mode, setMode] = useState<Mode>("hitl");
  const [runs, setRuns] = useState<Run[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/agent");
    if (res.ok) setRuns(await res.json());
  }, []);

  const poll = useCallback(async (id: number) => {
    const res = await fetch(`/api/agent/${id}`);
    if (!res.ok) return;
    const data: Run = await res.json();
    setRun(data);
    const live = ["planning", "running", "awaiting_approval"].includes(data.status);
    if (live) {
      pollRef.current = setTimeout(() => poll(id), 2500);
    }
  }, []);

  useEffect(() => {
    loadRuns();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [loadRuns]);

  async function start() {
    if (!goal.trim()) return;
    setBusy(true);
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, mode }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Failed to start agent");
      return;
    }
    const newRun: Run = await res.json();
    setActiveId(newRun.id);
    setRun(newRun);
    loadRuns();
    pollRef.current = setTimeout(() => poll(newRun.id), 800);
  }

  async function approve() {
    if (!activeId) return;
    await fetch(`/api/agent/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    poll(activeId);
  }

  async function cancel() {
    if (!activeId) return;
    await fetch(`/api/agent/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    poll(activeId);
  }

  async function changeMode(m: Mode) {
    if (!activeId) return;
    await fetch(`/api/agent/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    });
    poll(activeId);
  }

  const steps = run?.steps ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Agentic Lead Generator</h1>
          <p className="text-sm text-muted">
            Describe a goal in plain English — the agent runs Search → Enrich → Score for you.
          </p>
        </div>
      </div>

      {/* Composer */}
      <section className="border border-border rounded-xl bg-white p-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                mode === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="text-sm font-semibold text-text">{m.label}</div>
              <div className="text-xs text-muted mt-1">{m.hint}</div>
            </button>
          ))}
        </div>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="e.g. Find dentists in Chicago with no website, score the hottest 25"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="flex justify-end">
          <Button onClick={start} loading={busy} disabled={!goal.trim()}>
            <Play className="w-4 h-4" /> Run agent
          </Button>
        </div>
      </section>

      {/* Active run */}
      {run && activeId === run.id && (
        <section className="border border-border rounded-xl bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[run.status]}`}>
                {run.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted">mode:</span>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => changeMode(m.id)}
                  className={`px-2 py-1 rounded text-xs cursor-pointer border ${
                    run.mode === m.id ? "border-primary text-primary" : "border-border text-muted hover:border-primary/40"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {["planning", "running", "awaiting_approval"].includes(run.status) && (
              <Button variant="ghost" size="sm" onClick={cancel}>
                <X className="w-4 h-4" /> Cancel
              </Button>
            )}
          </div>

          {run.status === "awaiting_approval" && (
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1 text-sm text-amber-800">
                Plan-only mode: the agent wants to run{" "}
                <code className="font-mono">{run.pendingTool?.tool}</code>. Approve to continue.
              </div>
              <Button size="sm" variant="cta" onClick={approve}>
                <Check className="w-4 h-4" /> Approve
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {steps.map((s) => {
              const Icon = KIND_ICON[s.kind] ?? Sparkles;
              return (
                <div key={s.idx} className={`border-l-2 pl-3 py-2 rounded ${KIND_STYLE[s.kind]}`}>
                  <div className="flex items-center gap-2 text-xs font-medium text-text/80">
                    <Icon className="w-3.5 h-3.5" />
                    {s.toolName ? `${s.kind} · ${s.toolName}` : s.kind}
                  </div>
                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words text-text/90 font-sans">
                    {s.content}
                  </pre>
                </div>
              );
            })}
            {["planning", "running", "awaiting_approval"].includes(run.status) && (
              <div className="flex items-center gap-2 text-xs text-muted pl-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> agent working…
              </div>
            )}
          </div>

          {run.status === "completed" && run.finalSummary && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900 whitespace-pre-wrap">
              {run.finalSummary}
            </div>
          )}
        </section>
      )}

      {/* Past runs */}
      {runs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text">Past runs</h2>
          <div className="divide-y divide-border border border-border rounded-xl bg-white">
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveId(r.id);
                  poll(r.id);
                }}
                className="w-full text-left px-4 py-3 hover:bg-black/5 cursor-pointer flex items-center gap-3"
              >
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[r.status]}`}>
                  {r.status.replace("_", " ")}
                </span>
                <span className="flex-1 truncate text-sm text-text">{r.goal}</span>
                <span className="text-xs text-muted">{r.stepCount} steps</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
