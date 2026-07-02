"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import { KanbanCard } from "@/components/pipeline/KanbanCard";
import { Loader2 } from "lucide-react";

const STAGES = [
  { id: "new", label: "New", color: "#6366f1" },
  { id: "contacted", label: "Contacted", color: "#3b82f6" },
  { id: "replied", label: "Replied", color: "#f59e0b" },
  { id: "negotiating", label: "Negotiating", color: "#8b5cf6" },
  { id: "won", label: "Won", color: "#10b981" },
  { id: "lost", label: "Lost", color: "#ef4444" },
];

interface Lead {
  id: number;
  name: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  websiteStatus: string;
  bestContact: string | null;
  pipelineStage: string;
}

export default function PipelinePage() {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data, isLoading } = useQuery<{ items: Lead[] }>({
    queryKey: ["leads", "pipeline"],
    queryFn: () => fetch("/api/leads?pageSize=200").then(r => r.json()),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, pipelineStage }: { id: number; pipelineStage: string }) =>
      fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage }),
      }),
    onMutate: async ({ id, pipelineStage }) => {
      await qc.cancelQueries({ queryKey: ["leads", "pipeline"] });
      const prev = qc.getQueryData<{ items: Lead[] }>(["leads", "pipeline"]);
      qc.setQueryData<{ items: Lead[] }>(["leads", "pipeline"], (old) => ({
        ...old!,
        items: old!.items.map(l => l.id === id ? { ...l, pipelineStage } : l),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(["leads", "pipeline"], ctx?.prev),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overId = String(over.id);
    const stage = STAGES.find(s => s.id === overId);
    if (stage) {
      updateStage.mutate({ id: Number(active.id), pipelineStage: stage.id });
    }
  }

  const leads = data?.items ?? [];

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-white">
        <h1 className="text-xl font-bold text-text">Pipeline</h1>
        <p className="text-sm text-muted mt-0.5">Drag leads between stages</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-3 overflow-x-auto p-4">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.pipelineStage === stage.id);
            return (
              <KanbanColumn key={stage.id} id={stage.id} label={stage.label} color={stage.color} count={stageLeads.length}>
                <SortableContext items={stageLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  {stageLeads.map(lead => (
                    <KanbanCard key={lead.id} lead={lead} />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
