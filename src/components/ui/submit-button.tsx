'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';

// Breid de Button props uit voor volledige compatibiliteit
type SubmitButtonProps = ComponentProps<typeof Button> & {
  pendingText?: string;
  // 1. Voeg een optionele 'pending' prop toe.
  // We hernoemen hem intern naar 'pendingProp' om conflict met de hook te vermijden.
  pending?: boolean;
};

// 2. Maak een interne component die de hook gebruikt.
// Dit is een best practice omdat hooks niet conditioneel aangeroepen mogen worden.
function Status({ children, pendingText }: { children: React.ReactNode, pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? pendingText || children : children}
    </>
  );
}

export function SubmitButton({
  children,
  pendingText,
  pending: pendingProp, // Hernoem de prop voor duidelijkheid
  ...props
}: SubmitButtonProps) {
  
  // 3. Bepaal de 'isPending' state: gebruik de prop indien aanwezig, anders false.
  // De 'Status' component zal de 'useFormStatus' hook gebruiken als fallback.
  const isPending = pendingProp !== undefined ? pendingProp : false;

  const showStatus = pendingProp === undefined;

  return (
    <Button {...props} type="submit" disabled={props.disabled || isPending}>
      {/* Als we de pending prop meegeven (manuele mode), tonen we hier de spinner */}
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? (pendingText || children) : (
        // Als we in 'automatische' mode zijn, render de Status component die de hook gebruikt
        showStatus ? <Status pendingText={pendingText}>{children}</Status> : children
      )}
    </Button>
  );
}