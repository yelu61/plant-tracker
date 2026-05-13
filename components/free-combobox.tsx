"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function FreeCombobox({
  name,
  options,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  options: string[];
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [value, options]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 pr-16 py-2 text-sm shadow-sm transition placeholder:text-stone-400 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200 dark:border-stone-700 dark:bg-stone-900"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setValue("");
              inputRef.current?.focus();
            }}
            className="pointer-events-auto mr-1 text-stone-400 hover:text-stone-600"
            aria-label="清除"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="pointer-events-auto text-stone-400 hover:text-stone-600"
          aria-label="打开下拉"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition", open && "rotate-180")}
          />
        </button>
      </div>
      {open && filtered.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  setValue(opt);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-leaf-50 dark:hover:bg-leaf-950/30",
                  opt === value && "bg-leaf-50 font-medium dark:bg-leaf-950/40",
                )}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
