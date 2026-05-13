"use client";

import { ChevronLeft, Home, Leaf, Notebook, Package, Plus, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/plants", label: "花园", icon: Leaf },
  { href: "/quick-log", label: "打卡", icon: Plus, big: true },
  { href: "/supplies", label: "物品", icon: Package },
  { href: "/notes", label: "笔记", icon: Notebook },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <ul className="mx-auto flex max-w-3xl items-end justify-around px-2 pt-1">
        {items.map(({ href, label, icon: Icon, big }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          if (big) {
            return (
              <li key={href} className="-mt-6">
                <Link
                  href={href}
                  className="flex flex-col items-center"
                  aria-label={label}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-600 text-white shadow-lg ring-4 ring-white dark:ring-stone-950">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">
                    {label}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-leaf-700 dark:text-leaf-300" : "text-stone-500",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopBar({
  title,
  action,
  backHref,
}: {
  title: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="返回"
              className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <ChevronLeft className="h-5 w-5 text-stone-600" />
            </Link>
          ) : (
            <Sprout className="h-5 w-5 shrink-0 text-leaf-600" />
          )}
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
