import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[-0.01em] transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_6px_16px_-8px_var(--accent)] hover:bg-[var(--accent-strong)]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]",
        ghost: "text-[var(--ink-muted)] hover:bg-[var(--bg-elevated-2)] hover:text-[var(--ink)]",
        subtle: "bg-[var(--bg-elevated-2)] text-[var(--ink)] hover:bg-[var(--border-strong)]/70",
        danger: "bg-[var(--danger)] text-white hover:opacity-90",
      },
      size: {
        default: "h-10 rounded-full px-5",
        sm: "h-8 rounded-full px-3.5 text-[13px]",
        lg: "h-11 rounded-full px-7 text-[15px]",
        icon: "h-9 w-9 rounded-full",
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
