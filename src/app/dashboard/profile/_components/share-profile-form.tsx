// src/app/dashboard/profile/_components/share-profile-form.tsx
'use client';

import { useFormState } from 'react-dom';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
// CORRECTIE: De juiste acties importeren
import { addManagerByEmailAction, removeManagerByIdAction } from '@/lib/server/actions/profile-actions';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
// CORRECTIE: We importeren UserAvatar uit je gedeelde map
import { UserAvatar } from '@/components/shared/user-avatar';

interface ShareProfileFormProps {
  profile: UserProfile;
  managers: UserProfile[];
}

export default function ShareProfileForm({ profile, managers }: ShareProfileFormProps) {
  // Gebruik de nieuwe server action die met e-mail werkt
  const [addState, addFormAction] = useFormState(addManagerByEmailAction, { message: '', success: undefined, issues: [] });
  const addFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Toon toast alleen als er een bericht is
    if (addState.message) {
      if (addState.success === true) {
        toast.success('Gelukt!', { description: addState.message });
        addFormRef.current?.reset();
      } else if (addState.success === false) {
        const description = addState.issues?.join(', ') || addState.message;
        toast.error('Fout', { description });
      }
    }
  }, [addState]);

  return (
    <div className="space-y-6">
      <form ref={addFormRef} action={addFormAction}>
        <Card>
          <CardHeader>
            <CardTitle>Deel Toegang</CardTitle>
            <CardDescription>
              Voeg een andere gebruiker toe als beheerder van dit profiel via hun e-mailadres.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mailadres van gebruiker</Label>
              <Input id="email" name="email" type="email" placeholder="naam@voorbeeld.com" required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            {/* CORRECTIE: 'loadingText' wordt 'pendingText' */}
            <SubmitButton pendingText="Toevoegen...">Beheerder Toevoegen</SubmitButton>
          </CardFooter>
        </Card>
      </form>

      {managers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Huidige Beheerders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* CORRECTIE: De 'user' prop opsplitsen naar 'src' en 'name' */}
                  <UserAvatar 
                    src={manager.photoURL} 
                    name={manager.displayName} 
                    className="h-9 w-9" 
                  />
                  <div>
                    <p className="font-medium">{manager.displayName}</p>
                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                  </div>
                </div>
                {/* De RemoveButton krijgt nu ook de profileId mee */}
                <RemoveManagerForm managerId={manager.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Dit is nu een volwaardig form component
function RemoveManagerForm({ managerId }: { managerId: string }) {
  const [removeState, removeFormAction] = useFormState(removeManagerByIdAction, { message: '', success: undefined });
  
  useEffect(() => {
    if(removeState.message) {
      if(removeState.success) {
        toast.success(removeState.message);
      } else {
        toast.error('Fout', { description: removeState.message });
      }
    }
  }, [removeState]);

  return (
    <form action={removeFormAction}>
      {/* Een hidden input om de managerId mee te sturen met de form data */}
      <input type="hidden" name="managerId" value={managerId} />
      <SubmitButton variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" pendingText="">
        <X className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}