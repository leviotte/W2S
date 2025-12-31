// src/components/auth/login-form-ui.tsx
'use client';

import { useState, useTransition, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
  password: z.string().min(1, 'Wachtwoord is verplicht.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormUIProps {
  onSubmit: (data: LoginFormValues) => void;
  onSwitchToRegister?: () => void;
}

export function LoginFormUI({ onSubmit, onSwitchToRegister }: LoginFormUIProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSubmit = (data: LoginFormValues) => {
    startTransition(() => onSubmit(data));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="naam@voorbeeld.com" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wachtwoord</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input {...field} type={showPassword ? 'text' : 'password'} placeholder="••••••" disabled={isPending} className="pr-10" />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-[#6B8E23]" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>

        {onSwitchToRegister && (
          <div className="text-center text-sm text-gray-600">
            Nog geen account?{' '}
            <button type="button" onClick={onSwitchToRegister} className="text-[#6B8E23] hover:underline" disabled={isPending}>
              Registreer
            </button>
          </div>
        )}
      </form>
    </Form>
  );
}
