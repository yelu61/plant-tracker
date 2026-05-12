import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-leaf-600 text-white shadow-sm hover:bg-leaf-700 active:bg-leaf-800 disabled:bg-leaf-300",
  secondary:
    "bg-stone-200 text-stone-900 hover:bg-stone-300 active:bg-stone-400 disabled:opacity-50",
  ghost: "text-stone-700 hover:bg-stone-200 active:bg-stone-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
  outline:
    "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 active:bg-stone-200",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
