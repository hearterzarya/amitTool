import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-medium text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "gradient-surface-primary text-white font-semibold button-text-clear shadow-soft-md hover-lift hover:shadow-glow-primary",
        destructive: "bg-destructive text-destructive-foreground font-semibold button-text-clear shadow-soft-md hover-lift",
        outline: "border border-input/50 glass text-foreground font-medium shadow-soft hover-lift hover:glass-strong",
        secondary: "gradient-surface-accent text-white font-semibold button-text-clear shadow-soft-md hover-lift hover:shadow-glow",
        ghost: "hover:glass hover:text-foreground font-medium",
        link: "text-primary font-medium underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 rounded-lg",
        sm: "h-9 px-4 rounded-md text-xs",
        lg: "h-13 px-8 rounded-xl text-base",
        icon: "h-11 w-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
