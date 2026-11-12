import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider", {
  variants: {
    variant: {
      default: "bg-primary/15 text-primary",
      lime: "bg-lime/15 text-lime",
      pink: "bg-pink/15 text-pink",
      outline: "border border-border text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
