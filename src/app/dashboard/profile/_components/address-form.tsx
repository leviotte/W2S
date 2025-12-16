// src/app/dashboard/profile/_components/address-form.tsx
'use client';

// FIX 1: 'useActionState' importeren uit 'react'
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { useForm, type FieldValues } from 'react-hook-form'; // 'FieldValues' toegevoegd
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type UserProfile, type Address } from '@/types/user';
import { updateAddress } from '@/lib/server/actions/profile-actions';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';

interface AddressFormProps {
  profile: UserProfile;
}

const addressFields: { key: keyof Address; label: string }[] = [
    { key: 'street', label: 'Straat' },
    { key: 'number', label: 'Huisnummer' },
    { key: 'box', label: 'Bus' },
    { key: 'postalCode', label: 'Postcode' },
    { key: 'city', label: 'Stad' },
    { key: 'country', label: 'Land' },
];

export default function AddressForm({ profile }: AddressFormProps) {
  // FIX 2: Hook hernoemd naar useActionState
  const [state, formAction] = useActionState(updateAddress, { message: '' });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: profile.address?.street || '',
      number: profile.address?.number || '',
      box: profile.address?.box || '',
      postalCode: profile.address?.postalCode || '',
      city: profile.address?.city || '',
      country: profile.address?.country || '',
    },
  });

  useEffect(() => {
    if (state.message) {
       if (state.issues) {
        toast.error(state.message, { description: state.issues.join(', ') });
      } else {
        // Aangenomen dat als er geen 'issues' zijn, het een succes is.
        toast.success("Adres succesvol bijgewerkt!");
      }
    }
  }, [state]);

  // FIX 3: Wrapper functie om react-hook-form te verbinden met de server action.
  const onFormSubmit = (data: FieldValues) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    formAction(formData);
  };

  return (
    // FIX 4: handleSubmit koppelen aan de onSubmit van het formulier.
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Adres</CardTitle>
          <CardDescription>Update hier je adresgegevens.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {addressFields.map((field) => (
            <div className="grid gap-2" key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input id={field.key} {...register(field.key)} />
              {errors[field.key] && <p className="text-sm text-red-500">{errors[field.key]?.message}</p>}
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SubmitButton pendingText="Opslaan..." disabled={!isDirty}>Opslaan</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}