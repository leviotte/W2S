// src/components/profile/DateInput.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asterisk } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface DateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxDate?: string;
  required?: boolean;
  isRequired?: boolean;
}

const RequiredFieldMarker = () => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className="text-[#b34c4c] text-base leading-none align-middle ml-0.5 inline-flex"
            style={{ position: "relative", top: "-5px" }}
          >
            <Asterisk
              className="h-4 w-4 cursor-pointer"
              style={{ transform: "rotate(-30deg)" }}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-slate-50 text-chart-5 text-xs z-50 rounded-md py-2 px-2 shadow-lg"
            sideOffset={1}
            side="right"
          >
            Dit veld is nodig
            <Tooltip.Arrow className="fill-slate-50" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export function DateInput({
  id,
  label,
  value,
  onChange,
  maxDate,
  required,
  isRequired,
}: DateInputProps) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {isRequired && <RequiredFieldMarker />}
      </Label>
      <Input
        type="date"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={maxDate}
        required={required}
        className="mt-1"
      />
    </div>
  );
}