// src/app/dashboard/profile/_components/public-status-form.tsx
'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { togglePublicStatusAction } from '@/app/dashboard/profile/actions';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PublicStatusFormProps {
  profile: UserProfile;
}

export default function PublicStatusForm({ profile }: PublicStatusFormProps) {
  // We gebruiken hier niet de `form` van react-hook-form, dus de setup is simpeler
  const [state, formAction] = useFormState(togglePublicStatusAction, { success: false, message: '' });
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Lokale state voor de switch, zodat de UI direct update
  const [isPublic, setIsPublic] = useState(profile.isPublic ?? false);

  useEffect(() => {
    if (state.message) {
      // Toon de toast van de server action
      state.success 
        ? toast.success('Zichtbaarheid aangepast', { description: state.message }) 
        : toast.error('Fout', { description: state.message });
      
      // Als de actie faalt, zet de switch terug naar de oorspronkelijke staat
      if (!state.success) {
        setIsPublic(profile.isPublic ?? false);
      }
    }
  }, [state, profile.isPublic]);

  const handleCheckedChange = (checked: boolean) => {
    // 1. Update de UI onmiddellijk
    setIsPublic(checked);

    // 2. Start de server action op de achtergrond
    startTransition(() => {
      if (formRef.current) {
        // We maken handmatig de FormData aan en roepen de action aan
        const formData = new FormData(formRef.current);
        formData.set('isPublic', String(checked));
        formAction(formData);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profiel Zichtbaarheid</CardTitle>
        <CardDescription>
          Een publiek profiel kan gevonden worden door andere gebruikers. Een privé profiel is enkel zichtbaar via directe links (bv. voor een evenement).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Het formulier is hier enkel een wrapper voor de Server Action */}
        <form action={formAction} ref={formRef}>
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="public-status-switch" className="text-base font-medium leading-none">
                Profiel is Publiek
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? 'Je profiel is momenteel publiek.' : 'Je profiel is momenteel privé.'}
              </p>
            </div>
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="public-status-switch"
                checked={isPublic}
                onCheckedChange={handleCheckedChange}
                name="isPublic" // Belangrijk voor non-JS fallback
                value={String(isPublic)}
              />
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}