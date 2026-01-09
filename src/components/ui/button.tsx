import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 pressable relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[#7C3AED] text-white shadow-lg hover:shadow-xl hover:bg-[#6D28D9] active:scale-[0.97] glow-primary-hover border border-[#7C3AED]/30",
        destructive: "bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:bg-destructive/90 active:scale-[0.97]",
        outline: "border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] backdrop-blur-md text-foreground hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] active:scale-[0.97] hover:shadow-md",
        secondary: "bg-[rgba(255,255,255,0.08)] backdrop-blur-md text-foreground border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.12)] hover:shadow-lg active:scale-[0.97]",
        ghost: "hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground backdrop-blur-sm active:scale-[0.97]",
        link: "text-[#7C3AED] underline-offset-4 hover:underline hover:text-[#6D28D9]",
        accent: "bg-[#7C3AED] text-white shadow-lg hover:shadow-xl hover:bg-[#6D28D9] active:scale-[0.97] glow-primary-hover border border-[#7C3AED]/30",
        success: "bg-[#10B981] text-white shadow-lg hover:shadow-xl hover:bg-[#059669] active:scale-[0.97]",
        soft: "bg-[rgba(255,255,255,0.06)] backdrop-blur-sm text-muted-foreground border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.1)] hover:shadow-md active:scale-[0.97]",
        "soft-accent": "bg-[rgba(124,58,237,0.1)] backdrop-blur-sm text-[#7C3AED] border border-[rgba(124,58,237,0.2)] hover:bg-[rgba(124,58,237,0.15)] hover:shadow-md active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        xl: "h-12 rounded-lg px-8 text-base font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
