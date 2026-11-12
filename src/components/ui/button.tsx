import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Hardware-key style buttons: flat face, hard bottom edge, uppercase silkscreen label. */
const buttonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 rounded-md text-center text-[13px] font-bold uppercase leading-tight tracking-[0.05em] transition-[transform,filter,box-shadow] active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shadow)] hover:brightness-110 active:shadow-none",
        lime: "bg-lime text-lime-foreground shadow-[0_3px_0_0_var(--lime-shadow)] hover:brightness-105 active:shadow-none",
        pink: "bg-pink text-pink-foreground shadow-[0_3px_0_0_var(--pink-shadow)] hover:brightness-110 active:shadow-none",
        secondary: "border border-border bg-secondary text-secondary-foreground shadow-[0_3px_0_0_#0b0a09] hover:bg-[#312d26] active:shadow-none",
        outline: "border border-border bg-transparent hover:bg-secondary",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        destructive: "bg-destructive text-[#1a0806] hover:brightness-110",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 px-3 py-1.5 text-[11px]",
        lg: "min-h-13 px-5 py-2 text-sm sm:px-7",
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
