// src/components/auth/register-form-ui.tsx
'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1),
  gender: z.string().min(1),
  country: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(1),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormUIProps {
  onSubmit: (data: RegisterFormValues) => void;
  onSwitchToLogin?: () => void;
}

export function RegisterFormUI({ onSubmit, onSwitchToLogin }: RegisterFormUIProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: '',
      country: '',
      location: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = (data: RegisterFormValues) => {
    startTransition(() => onSubmit(data));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">

        <FormField control={form.control} name="firstName" render={({ field }) => (
          <FormItem>
            <FormLabel>Voornaam</FormLabel>
            <FormControl><Input {...field} disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="lastName" render={({ field }) => (
          <FormItem>
            <FormLabel>Achternaam</FormLabel>
            <FormControl><Input {...field} disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="birthDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Geboortedatum</FormLabel>
            <FormControl><Input {...field} type="date" disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="gender" render={({ field }) => (
          <FormItem>
            <FormLabel>Gender</FormLabel>
            <FormControl><Input {...field} placeholder="Man / Vrouw / Andere" disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="country" render={({ field }) => (
          <FormItem>
            <FormLabel>Land</FormLabel>
            <FormControl><Input {...field} disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel>Locatie</FormLabel>
            <FormControl><Input {...field} disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl><Input {...field} type="email" disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Wachtwoord</FormLabel>
            <FormControl>
              <div className="relative">
                <Input {...field} type={showPassword ? 'text' : 'password'} disabled={isPending} className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)} disabled={isPending}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Bevestig Wachtwoord</FormLabel>
            <FormControl>
              <div className="relative">
                <Input {...field} type={showConfirm ? 'text' : 'password'} disabled={isPending} className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowConfirm(!showConfirm)} disabled={isPending}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-[#6B8E23]" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>

        {onSwitchToLogin && (
          <div className="text-center text-sm text-gray-600">
            Heb je al een account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="text-[#6B8E23] hover:underline" disabled={isPending}>
              Log in
            </button>
          </div>
        )}
      </form>
    </Form>
  );
}
