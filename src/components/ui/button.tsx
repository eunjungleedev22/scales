import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 rounded-2xl text-center text-sm font-bold leading-tight transition-all active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-shadow)] hover:brightness-110 active:shadow-none",
        lime: "bg-lime text-lime-foreground shadow-[0_4px_0_0_var(--lime-shadow)] hover:brightness-105 active:shadow-none",
        pink: "bg-pink text-white shadow-[0_4px_0_0_var(--pink-shadow)] hover:brightness-110 active:shadow-none",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_3px_0_0_rgba(0,0,0,0.35)] active:shadow-none",
        outline: "border-2 border-border bg-transparent hover:bg-secondary",
        ghost: "hover:bg-secondary",
        destructive: "bg-destructive text-white hover:brightness-110",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-9 px-3 py-1.5 text-xs rounded-xl",
        lg: "min-h-14 px-6 py-2 text-base sm:px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
