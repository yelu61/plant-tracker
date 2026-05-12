import * as React from "react";

import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-stone-400 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(baseField, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 3, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(baseField, "min-h-20 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(baseField, "h-10 pr-8", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium text-stone-600 dark:text-stone-300", className)}
      {...props}
    />
  );
}

export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
