// src/app/dashboard/profile/_components/address-form.tsx

'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SessionUser } from '@/types/user';
import { toast } from 'sonner';

import { profileAddressSchema } from '@/lib/validators/profile';
import { updateAddressAction } from '../actions'; 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

// Zod schema voor het formulier, afgeleid van het validatie schema
type FormValues = z.infer<typeof profileAddressSchema>;

// Definieer de velden van het formulier voor iteratie
const addressFields: {
  key: keyof NonNullable<FormValues['address']>; // CORRECTIE: keyof op het afgeleide type!
  label: string;
}[] = [
  { key: 'street', label: 'Straat en huisnummer' },
  { key: 'city', label: 'Stad' },
  { key: 'postalCode', label: 'Postcode' },
  { key: 'country', label: 'Land' },
];

interface AddressFormProps {
  user: SessionUser;
}

export function AddressForm({ user }: AddressFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(profileAddressSchema),
    defaultValues: {
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || '',
      },
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    const result = await updateAddressAction(values);
    if (result.success) {
      toast.success('Adres succesvol bijgewerkt!');
    } else {
      toast.error(result.message || 'Er is een fout opgetreden.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adres</CardTitle>
        <CardDescription>
          Werk hier je adresgegevens bij. Deze worden enkel gebruikt voor relevante doeleinden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addressFields.map(({ key, label }) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`address.${key}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <SubmitButton isSubmitting={isSubmitting}>
                Opslaan
              </SubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}