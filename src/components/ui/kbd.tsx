import { cn } from "@/lib/utils";
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn("hidden rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground md:inline-block", className)}>{children}</kbd>;
}
