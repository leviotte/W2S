// src/components/DateInput.tsx
import React, { memo } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import RequiredFieldMarker from "./RequiredFieldMarker";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;        // HTML required
  isRequired?: boolean;      // visual indicator
  label: string;
  maxDate?: string;
  id: string;
  className?: string;
}

function DateInputComponent({
  value,
  onChange,
  error,
  required = false,
  isRequired = false,
  label,
  maxDate,
  id,
  className = "",
}: DateInputProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <Label htmlFor={id} className="text-accent font-medium">
        {label}
        {isRequired && <RequiredFieldMarker />}
      </Label>

      <Input
        id={id}
        type="date"
        value={value}
        max={maxDate}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder="YYYY-MM-DD"
        className="mt-1"
      />

      {error && (
        <p className="mt-1 text-sm font-medium text-[#b34c4c]">
          {error}
        </p>
      )}
    </div>
  );
}

export default memo(DateInputComponent);
