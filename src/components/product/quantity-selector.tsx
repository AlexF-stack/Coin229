"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({ value, min = 1, max, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-[16px] bg-card px-1.5 py-1 sm:gap-3 sm:px-2 sm:py-1.5">
      <button
        type="button"
        aria-label="Diminuer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-fg disabled:opacity-30"
      >
        <Minus className="h-4 w-4 stroke-[1.5]" />
      </button>
      <span className="min-w-5 text-center text-sm font-semibold tabular-nums sm:min-w-6 sm:text-base">
        {value}
      </span>
      <button
        type="button"
        aria-label="Augmenter"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-fg disabled:opacity-30"
      >
        <Plus className="h-4 w-4 stroke-[1.5]" />
      </button>
    </div>
  );
}
