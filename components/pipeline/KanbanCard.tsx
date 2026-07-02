"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { Mail, Phone } from "lucide-react";

interface Lead {
  id: number;
  name: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  websiteStatus: string;
  bestContact: string | null;
}

export function KanbanCard({ lead }: { lead: Lead }) {
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
      <p className="font-medium text-text text-sm leading-tight">{lead.name}</p>
      {lead.category && <p className="text-xs text-muted mt-0.5">{lead.category}</p>}
      <div className="mt-2 flex items-center gap-1.5">
        <StatusBadge status={lead.websiteStatus} />
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
