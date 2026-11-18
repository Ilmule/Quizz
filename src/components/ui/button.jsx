import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-primary hover:bg-primary/85",
        outline: "border-border bg-transparent hover:border-primary hover:text-primary",
        destructive: "border-destructive/60 text-destructive hover:bg-destructive/10",
        ghost: "border-transparent hover:bg-white/5",
      },
      size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", icon: "h-8 w-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
