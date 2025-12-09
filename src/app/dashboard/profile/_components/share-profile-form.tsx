// src/app/dashboard/profile/_components/share-profile-form.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { addManager, removeManager } from '@/app/dashboard/profile/actions';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { UserAvatar } from '@/components/shared/user-avatar';

interface ShareProfileFormProps {
  profile: UserProfile;
  managers: UserProfile[];
}

export default function ShareProfileForm({ profile, managers }: ShareProfileFormProps) {
  const [addState, addFormAction] = useFormState(addManager, { message: '' });
  const addFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.message) {
      if (addState.issues) {
        toast.error(addState.message, { description: addState.issues.join(', ') });
      } else {
        toast.success(addState.message);
        addFormRef.current?.reset();
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
              Voeg een andere gebruiker toe als beheerder van dit profiel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mailadres van gebruiker</Label>
              <Input id="email" name="email" type="email" placeholder="naam@voorbeeld.com" required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton loadingText="Toevoegen...">Beheerder Toevoegen</SubmitButton>
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
                  <UserAvatar user={manager} className="h-9 w-9" />
                  <div>
                    <p className="font-medium">{manager.displayName}</p>
                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                  </div>
                </div>
                <RemoveButton managerId={manager.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RemoveButton({ managerId }: { managerId: string }) {
  const { pending } = useFormStatus();

  const handleRemove = async () => {
    const { success, message } = await removeManager(managerId);
    if (success) toast.success(message);
    else toast.error(message);
  };

  return (
    <form action={handleRemove}>
      <SubmitButton variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" loadingText="" disabled={pending}>
        <X className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}