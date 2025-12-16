'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { useForm, Controller, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from '@/types/user';
import { updatePersonalInfo } from '@/lib/server/actions/profile-actions';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SubmitButton } from '@/components/ui/submit-button';

// FIX 2: Correcte naam voor het schema
const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht.'),
  lastName: z.string().min(1, 'Achternaam is verplicht.'),
  isPublic: z.boolean().default(false),
});

// FIX 3: Correcte naam voor het afgeleide type
type PersonalInfoFormData = z.infer<typeof PersonalInfoSchema>;

interface PersonalInfoFormProps {
  profile: UserProfile;
}

const initialState = { success: false, message: '', issues: [] };

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  // FIX 4: Hook hernoemd naar useActionState
  const [state, formAction] = useActionState(updatePersonalInfo, initialState);

  const { register, control, handleSubmit, formState: { errors, isDirty } } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      isPublic: profile.isPublic || false,
    },
  });

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
      } else if (state.issues) {
        toast.error(state.message, { description: state.issues.join('\n') });
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const onFormSubmit = (data: FieldValues) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'isPublic') {
            if (data[key]) {
                formData.append(key, 'on');
            }
        } else {
            formData.append(key, data[key]);
        }
    });
    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Persoonlijke Gegevens</CardTitle>
          <CardDescription>Deze gegevens zijn zichtbaar op je publieke profielpagina, indien ingeschakeld.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">Voornaam</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Achternaam</Label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="isPublic"
              // FIX 5: Correcte prop 'control'
              control={control}
              render={({ field }) => (
                <Switch
                  id="isPublic"
                  checked={field.value}
                  // FIX 6: Correcte prop 'onCheckedChange'
                  onCheckedChange={field.onChange}
                  aria-label="Publiek profiel"
                />
              )}
            />
            <Label htmlFor="isPublic">Publiek profiel</Label>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SubmitButton pendingText="Opslaan..." disabled={!isDirty}>Opslaan</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}