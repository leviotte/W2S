// src/app/dashboard/profile/_components/address-form.tsx
'use client';
import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSchema, type UserProfile, type Address } from '@/types/user';
import { updateAddress } from '@/app/dashboard/profile/actions';

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
  const [state, formAction] = useFormState(updateAddress, { message: '' });

  const { register, formState: { errors, isDirty } } = useForm<Address>({
    resolver: zodResolver(AddressSchema),
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
        toast.success(state.message);
      }
    }
  }, [state]);

  return (
    <form action={formAction}>
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