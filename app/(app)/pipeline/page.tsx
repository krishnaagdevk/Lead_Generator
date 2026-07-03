"use client";

import { useLeadsQuery, useOfflineUpdateLead } from "@/hooks/useLeads";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import { KanbanCard } from "@/components/pipeline/KanbanCard";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
  dealValue: number | null;
}

export default function PipelinePage() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(50);

  const { data, isLoading } = useLeadsQuery("pageSize=1000");

  const updateStage = useOfflineUpdateLead();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overId = String(over.id);
    const stage = STAGES.find(s => s.id === overId);
    if (stage) {
      updateStage.mutate({ id: Number(active.id), updates: { pipelineStage: stage.id } });
    }
  }

  const fetchedLeads = (data?.items ?? []) as Lead[];
  const totalLeads = fetchedLeads.length;
  const paginatedLeads = pageSize === "all" ? fetchedLeads : fetchedLeads.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text">Pipeline</h1>
          <p className="text-sm text-muted mt-0.5">{totalLeads} total leads</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value;
              setPageSize(val === "all" ? "all" : Number(val));
              setPage(1);
            }}
            className="h-8 px-2 rounded-md border border-border bg-white text-text font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {[10, 20, 50, 100, 200].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
            <option value="all">Show All</option>
          </select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-3 overflow-x-auto p-4">
          {STAGES.map(stage => {
            const stageLeads = paginatedLeads.filter(l => l.pipelineStage === stage.id);
            return (
              <KanbanColumn key={stage.id} id={stage.id} label={stage.label} color={stage.color} count={stageLeads.length}>
                <SortableContext items={stageLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  {stageLeads.map(lead => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      stageIndex={STAGES.findIndex(s => s.id === stage.id)}
                      totalStages={STAGES.length}
                      onMoveLeft={(id) => {
                        const prevStage = STAGES[STAGES.findIndex(s => s.id === stage.id) - 1];
                        if (prevStage) updateStage.mutate({ id, updates: { pipelineStage: prevStage.id } });
                      }}
                      onMoveRight={(id) => {
                        const nextStage = STAGES[STAGES.findIndex(s => s.id === stage.id) + 1];
                        if (nextStage) updateStage.mutate({ id, updates: { pipelineStage: nextStage.id } });
                      }}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>
      </DndContext>

      {data && pageSize !== "all" && totalLeads > pageSize && (
        <div className="border-t border-border bg-white px-6 py-3 flex items-center justify-between text-sm text-muted shrink-0">
          <span>Page {page} of {Math.ceil(totalLeads / (pageSize as number))}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-border disabled:opacity-40 cursor-pointer hover:bg-background transition-colors">Prev</button>
            <button disabled={page >= Math.ceil(totalLeads / (pageSize as number))} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-border disabled:opacity-40 cursor-pointer hover:bg-background transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
