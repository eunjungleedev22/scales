import { cn } from "@/lib/utils";
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn("hidden rounded-[3px] border border-border bg-[#0f0e0c] px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-block", className)}>{children}</kbd>;
}
