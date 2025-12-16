// src/app/dashboard/settings/_components/profile-info-form.tsx
'use client';

// FIX: useActionState importeren uit 'react' i.p.v. 'react-dom'
import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SubmitButton } from '@/components/ui/submit-button';

import { updateProfileInfo, type ProfileInfoFormState } from '../actions';
import type { UserProfile } from '@/types/user';

interface ProfileInfoFormProps {
  initialData: Pick<UserProfile, 'displayName' | 'username' | 'isPublic'>;
}

export function ProfileInfoForm({ initialData }: ProfileInfoFormProps) {
  const initialState: ProfileInfoFormState = { success: false, message: '' };
  
  // FIX: useFormState hernoemd naar useActionState
  const [formState, formAction] = useActionState(updateProfileInfo, initialState);
  
  // useFormStatus moet na useActionState worden aangeroepen.
  const { pending } = useFormStatus();

  useEffect(() => {
    if (formState.message) {
      if (formState.success) {
        toast.success('Profiel opgeslagen!', { description: formState.message });
      } else if (formState.message && !formState.errors) {
        toast.error('Opslaan mislukt', { description: formState.message });
      }
    }
  }, [formState]);

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Publiek Profiel</CardTitle>
          <CardDescription>
            Deze informatie zal zichtbaar zijn voor andere gebruikers op de site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Weergavenaam</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={initialData.displayName}
              required
            />
             {formState.errors?.displayName && (
                <p className="text-sm font-medium text-destructive">
                    {formState.errors.displayName[0]}
                </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Gebruikersnaam</Label>
            <Input
              id="username"
              name="username"
              defaultValue={initialData.username || ''}
              placeholder='bv. levi-otte'
            />
            <p className="text-sm text-muted-foreground">
              Je unieke profiel-URL: wish2share.com/profile/
              <strong>{initialData.username || 'jouw-gebruikersnaam'}</strong>
            </p>
             {formState.errors?.username && (
                <p className="text-sm font-medium text-destructive">
                    {formState.errors.username[0]}
                </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic" className="text-base">Profiel Openbaar</Label>
                <p className="text-sm text-muted-foreground">
                  Laat andere gebruikers je profiel en wenslijsten vinden.
                </p>
              </div>
              <Switch
                id="isPublic"
                name="isPublic"
                defaultChecked={initialData.isPublic}
              />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SubmitButton pending={pending}>Profiel Opslaan</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}