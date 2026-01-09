import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 pressable relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 active:scale-[0.96] glow-accent-hover",
        destructive: "bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:bg-destructive/90 active:scale-[0.96]",
        outline: "border-2 border-input/50 bg-background/50 backdrop-blur-sm shadow-sm hover:bg-secondary/50 hover:border-input hover:text-secondary-foreground active:scale-[0.96] hover:shadow-md",
        secondary: "bg-secondary/80 backdrop-blur-sm text-secondary-foreground shadow-md hover:bg-secondary/90 hover:shadow-lg active:scale-[0.96]",
        ghost: "hover:bg-secondary/50 hover:text-secondary-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:bg-accent/90 active:scale-[0.96] glow-accent-hover",
        success: "bg-status-success text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-[0.96]",
        soft: "bg-muted/60 backdrop-blur-sm text-muted-foreground hover:bg-muted/80 hover:shadow-md active:scale-[0.96]",
        "soft-accent": "bg-accent/10 backdrop-blur-sm text-accent hover:bg-accent/20 hover:shadow-md active:scale-[0.96]",
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
