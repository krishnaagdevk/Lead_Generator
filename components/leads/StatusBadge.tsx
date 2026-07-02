import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG = {
  no_website: { label: "No Website", dot: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  broken: { label: "Broken", dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  live: { label: "Has Website", dot: "#10b981", bg: "#f0fdf4", text: "#065f46" },
  unknown: { label: "Checking...", dot: "#94a3b8", bg: "#f8fafc", text: "#475569" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", className)}
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
