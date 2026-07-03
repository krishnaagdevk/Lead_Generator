"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";

interface Step { id: number; stepNumber: number; delayDays: number; subject: string; body: string; }

export function SequenceBuilder({ campaignId }: { campaignId: number }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const { data: steps = [] } = useQuery<Step[]>({
    queryKey: ["steps", campaignId],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/steps`).then(r => r.json()),
  });

  const addStep = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${campaignId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delayDays: 3, subject: "Following up on my last message", body: "Hi {{name}},\n\nJust wanted to follow up..." }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["steps", campaignId] }),
  });

  const deleteStep = useMutation({
    mutationFn: (stepId: number) => fetch(`/api/campaigns/${campaignId}/steps/${stepId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["steps", campaignId] }),
  });

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={step.id} className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
                {step.stepNumber}
              </span>
              {i === 0
                ? <span className="text-xs font-semibold text-text">Initial Email</span>
                : <span className="text-xs text-muted">Follow-up after <strong>{step.delayDays} days</strong></span>
              }
            </div>
            {steps.length > 1 && (
              <button onClick={() => deleteStep.mutate(step.id)} className="text-muted hover:text-red-500 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            defaultValue={step.subject}
            onBlur={async e => {
              await fetch(`/api/campaigns/${campaignId}/steps/${step.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject: e.target.value }),
              });
            }}
            className="w-full mb-2 h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Subject line"
          />
          <textarea
            defaultValue={step.body}
            onBlur={async e => {
              await fetch(`/api/campaigns/${campaignId}/steps/${step.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: e.target.value }),
              });
            }}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder="Email body..."
          />
        </div>
      ))}

      {steps.length < 5 && (
        <Button variant="secondary" size="sm" onClick={() => addStep.mutate()} loading={addStep.isPending}>
          <Plus className="w-4 h-4" /> Add Follow-up Step
        </Button>
      )}
    </div>
  );
}