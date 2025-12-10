'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';

// Breid de Button props uit voor volledige compatibiliteit
type SubmitButtonProps = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText,
  ...props
}: SubmitButtonProps) {
  // useFormStatus moet een child zijn van een <form> element
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={props.disabled || pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? pendingText || children : children}
    </Button>
  );
}