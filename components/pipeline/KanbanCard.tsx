"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";

interface Lead {
  id: number;
  name: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  websiteStatus: string;
  bestContact: string | null;
  dealValue: number | null;
}

interface KanbanCardProps {
  lead: Lead;
  stageIndex: number;
  totalStages: number;
  onMoveLeft?: (id: number) => void;
  onMoveRight?: (id: number) => void;
}

export function KanbanCard({ lead, stageIndex, totalStages, onMoveLeft, onMoveRight }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing shadow-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium text-text text-sm leading-tight break-words flex-1 min-w-0">{lead.name}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          {stageIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveLeft?.(lead.id); }}
              className="p-0.5 rounded text-muted hover:text-text hover:bg-background cursor-pointer transition-colors"
              title="Move to previous stage"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {stageIndex < totalStages - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveRight?.(lead.id); }}
              className="p-0.5 rounded text-muted hover:text-text hover:bg-background cursor-pointer transition-colors"
              title="Move to next stage"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {lead.category && <p className="text-xs text-muted mt-0.5">{lead.category}</p>}
       <div className="mt-2 flex items-center gap-1.5">
         <StatusBadge status={lead.websiteStatus} />
         {lead.dealValue && (
           <span className="text-xs font-bold text-emerald-600">${lead.dealValue.toLocaleString()}</span>
         )}
       </div>
       <div className="mt-2 flex items-center gap-2">
         {lead.email && (
           <span title={lead.email} className="text-muted">
             <Mail className="w-3 h-3" />
           </span>
         )}
         {lead.phone && (
           <span title={lead.phone} className="text-muted">
             <Phone className="w-3 h-3" />
           </span>
         )}
       </div>
    </div>
  );
}
