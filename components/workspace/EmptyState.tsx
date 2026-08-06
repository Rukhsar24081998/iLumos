import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

/** Shared empty-state copy block for workspace panels. */
export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center",
        className
      )}
      role="status"
    >
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
