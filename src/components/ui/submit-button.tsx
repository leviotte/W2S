// src/components/ui/submit-button.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

interface SubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean;
}

export function SubmitButton({ children, isSubmitting, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const submitting = pending || isSubmitting;

  return (
    <Button type="submit" disabled={submitting} {...props}>
      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}