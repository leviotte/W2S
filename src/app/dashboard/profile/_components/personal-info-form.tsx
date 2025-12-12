// src/app/dashboard/profile/_components/personal-info-form.tsx
'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useForm, Controller, type FieldValues } from 'react-hook-form'; // VOEGT Controller TOE
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // IMPORTEERT 'z'
import type { UserProfile } from '@/types/user';
import { updatePersonalInfo } from '@/lib/server/actions/profile-actions';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SubmitButton } from '@/components/ui/submit-button';

// 1. Correct Schema definitie
const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht.'),
  lastName: z.string().min(1, 'Achternaam is verplicht.'),
  isPublic: z.boolean().default(false),
});

// 2. Correct Type Inference
type PersonalInfoFormData = z.infer<typeof PersonalInfoSchema>;

interface PersonalInfoFormProps {
  profile: UserProfile;
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  // Dit blijft perfect voor de Server Action communicatie
  const [state, formAction] = useFormState(updatePersonalInfo, { message: '' });

  // 3. React Hook Form Setup
  const { register, control, handleSubmit, formState: { errors, isDirty } } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      isPublic: profile.isPublic || false,
    },
  });

  // 4. Toast-notificaties gebaseerd op de server response
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

  // Functie die de react-hook-form data doorgeeft aan de server action
  const onFormSubmit = (data: FieldValues) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        // Speciale behandeling voor booleans in FormData
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
    // 5. handleSubmit koppelen
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
            {/* 6. Correcte implementatie van Controller */}
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isPublic"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Publiek profiel"
                />
              )}
            />
            <Label htmlFor="isPublic">Publiek profiel</Label>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          {/* 7. SubmitButton met correcte state */}
          <SubmitButton pendingText="Opslaan..." disabled={!isDirty}>Opslaan</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}