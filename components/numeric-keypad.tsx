"use client";

import { Button } from "@/components/ui/button";
import { Delete, Check } from "lucide-react";

type Props = {
  onAppend: (s: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function NumericKeypad({ onAppend, onBackspace, onClear, onSubmit, disabled }: Props) {
  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["0", ".", "/"],
    ["%"],
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.flat().map((k, i) => (
        <Button key={i} size="lg" variant="secondary" disabled={disabled} onClick={() => onAppend(k)}>
          {k}
        </Button>
      ))}
      <Button size="lg" variant="ghost" onClick={onBackspace} disabled={disabled} aria-label="Backspace">
        <Delete className="size-5" />
      </Button>
      <Button size="lg" variant="ghost" onClick={onClear} disabled={disabled} aria-label="Clear">
        Clear
      </Button>
      <Button size="lg" onClick={onSubmit} disabled={disabled} className="col-span-1 gap-2">
        <Check className="size-5" /> Submit
      </Button>
    </div>
  );
}

