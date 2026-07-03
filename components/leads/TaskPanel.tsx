"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TaskPanel({ leadId }: { leadId: number }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", leadId],
    queryFn: () => fetch(`/api/tasks?leadId=${leadId}`).then(r => r.json()),
  });

  const createTask = useMutation({
    mutationFn: () => fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, title, dueAt }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", leadId] }); 
      setTitle(""); 
      setDueAt("");
    },
  });

  const completeTask = useMutation({
    mutationFn: (taskId: number) => fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", leadId] }),
  });

  return (
    <div>
      <p className="text-xs font-bold text-muted uppercase mb-2">Tasks & Reminders</p>
      <div className="flex flex-col gap-1.5 mb-3">
        {tasks.map((task: any) => (
          <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg border ${task.completedAt ? "bg-background border-border opacity-50" : "bg-white border-border"}`}>
            <button onClick={() => completeTask.mutate(task.id)} className="cursor-pointer">
              <Check className={`w-3.5 h-3.5 ${task.completedAt ? "text-emerald-500" : "text-muted"}`} />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${task.completedAt ? "line-through" : "text-text"}`}>{task.title}</p>
              <p className="text-[10px] text-muted">{new Date(task.dueAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="flex-1 h-8 text-xs px-2 border border-border rounded-md focus:outline-none" />
        <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} className="h-8 text-xs px-2 border border-border rounded-md focus:outline-none" />
        <Button size="sm" disabled={!title || !dueAt} onClick={() => createTask.mutate()} loading={createTask.isPending}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}