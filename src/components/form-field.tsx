import type { ReactNode } from "react";

export const INPUT_CLASS =
  "h-12 rounded-input border border-border bg-surface-soft px-3.5 text-[14.5px] font-normal text-ink outline-brand-green";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  // Right-aligned, in the same fixed-height row as the error (e.g. a counter).
  hint?: string;
  children: ReactNode;
}) {
  // Fixed-height error slot: validation messages never shift the layout.
  return (
    <label className="flex flex-col gap-[7px] text-xs font-semibold text-text-tertiary">
      {label}
      {children}
      <span className="flex h-4 justify-between gap-3 text-[12px] leading-4 font-normal">
        <span className="text-copper">{error}</span>
        {hint && <span className="text-text-muted">{hint}</span>}
      </span>
    </label>
  );
}
