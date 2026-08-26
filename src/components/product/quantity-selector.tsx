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
    <div className="inline-flex items-center gap-3 rounded-[16px] bg-card px-2 py-1.5">
      <button
        type="button"
        aria-label="Diminuer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-fg disabled:opacity-30"
      >
        <Minus className="h-4 w-4 stroke-[1.5]" />
      </button>
      <span className="min-w-6 text-center font-semibold tabular-nums">{value}</span>
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
