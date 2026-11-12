"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/** Segmented LED-meter progress bar. */
export function Progress({ className, value, indicatorClassName, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <ProgressPrimitive.Root className={cn("relative h-2.5 w-full overflow-hidden rounded-[2px] bg-[#0f0e0c] ring-1 ring-border", className)} value={v} {...props}>
      <ProgressPrimitive.Indicator className={cn("h-full bg-lime transition-[width] duration-500", indicatorClassName)} style={{ width: `${v}%` }} />
      {/* segment gaps */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 7px, #0f0e0c 7px 9px)" }} />
    </ProgressPrimitive.Root>
  );
}
