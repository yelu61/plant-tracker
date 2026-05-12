import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
      {icon ? <div className="mb-3 text-4xl">{icon}</div> : null}
      <p className="text-sm font-medium text-stone-700 dark:text-stone-200">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-xs text-stone-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
