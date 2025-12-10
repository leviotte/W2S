'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { nlBE } from 'date-fns/locale'; // Voor correcte Belgisch-Nederlandse formattering
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

// 1. Definieer de nieuwe, robuuste props
export interface DatePickerProps {
  id?: string;
  label?: string;
  value?: Date; // We werken met echte Date-objecten, niet strings
  onValueChange?: (date?: Date) => void;
  toDate?: Date; // Vervangt maxDate voor consistentie met react-day-picker
  className?: string;
  isRequired?: boolean;
  disabled?: boolean;
}

export function DatePicker({
  id,
  label,
  value,
  onValueChange,
  toDate,
  className,
  isRequired,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (selectedDate?: Date) => {
    if (onValueChange) {
      onValueChange(selectedDate);
    }
    setIsOpen(false); // Sluit de popover na selectie
  };

  return (
    <div className={cn('grid gap-2', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {isRequired && <span className="text-destructive"> *</span>}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={'outline'}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, 'PPP', { locale: nlBE })
            ) : (
              <span>Kies een datum</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            toDate={toDate} // Hier gebruiken we de toDate prop
            disabled={disabled}
            initialFocus
            locale={nlBE} // Zorgt dat de kalender in het Nederlands is
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}