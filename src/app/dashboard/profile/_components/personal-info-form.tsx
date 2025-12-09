// src/app/dashboard/profile/_components/personal-info-form.tsx
'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserProfileSchema, type UserProfile } from '@/types/user';
import { updatePersonalInfo } from '@/app/dashboard/profile/actions';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SubmitButton } from '@/components/ui/submit-button';

const PersonalInfoSchema = UserProfileSchema.pick({
  firstName: true,
  lastName: true,
  isPublic: true,
});

type PersonalInfoFormData = Zod.infer<typeof PersonalInfoSchema>;

interface PersonalInfoFormProps {
  profile: UserProfile;
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const [state, formAction] = useFormState(updatePersonalInfo, { message: '' });

  const { register, control, formState: { errors, isDirty } } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      isPublic: profile.isPublic || false,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.issues) {
        toast.error(state.message, { description: state.issues.join(', ')});
      } else {
        toast.success(state.message);
      }
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Persoonlijke Gegevens</CardTitle>
          <CardDescription>Deze gegevens zijn zichtbaar op je publieke profielpagina.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">Voornaam</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Achternaam</Label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Controller name="isPublic" control={control} render={({ field }) => (
              <Switch id="isPublic" checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <Label htmlFor="isPublic">Publiek profiel</Label>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SubmitButton loadingText="Opslaan..." disabled={!isDirty}>Opslaan</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}