'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { getClientAuth } from '@/lib/client/firebase';
import { completeRegistrationAction } from '@/lib/server/actions/auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht'),
  lastName: z.string().min(1, 'Achternaam is verplicht'),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters bevatten'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthdate: '',
      gender: '',
      country: '',
      location: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    startTransition(async () => {
      try {
        // Step 1: Create Firebase user
        const auth = getClientAuth();
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          data.email, 
          data.password
        );
        
        const user = userCredential.user;

        // Step 2: Update display name
        await updateProfile(user, {
          displayName: `${data.firstName} ${data.lastName}`,
        });

        // Step 3: Send verification email
        await sendEmailVerification(user);

        // Step 4: Get ID token
        const idToken = await user.getIdToken();

        // Step 5: Complete registration server-side (create Firestore profile)
        const result = await completeRegistrationAction({
          idToken,
          firstName: data.firstName,
          lastName: data.lastName,
          birthdate: data.birthdate,
          gender: data.gender,
          country: data.country,
          location: data.location,
        });

        if (result.success) {
          toast.success('Account succesvol aangemaakt!', {
            description: 'Controleer je e-mail voor de verificatie link.',
          });
          
          // Sign out (user moet eerst email verifiëren)
          await auth.signOut();
          
          if (onSuccess) {
            onSuccess();
          }
          
          // Switch to login
          if (onSwitchToLogin) {
            onSwitchToLogin();
          } else {
            router.push('/');
          }
        } else {
          toast.error('Registratie mislukt', { 
            description: result.error || 'Er ging iets mis bij het aanmaken van je profiel.' 
          });
        }

      } catch (error: any) {
        console.error('Firebase registration error:', error);
        
        let friendlyMessage = 'Er is een onbekende fout opgetreden.';
        
        if (error.code === 'auth/email-already-in-use') {
          friendlyMessage = 'Dit e-mailadres is al in gebruik.';
        } else if (error.code === 'auth/weak-password') {
          friendlyMessage = 'Wachtwoord is te zwak. Kies een sterker wachtwoord.';
        } else if (error.code === 'auth/invalid-email') {
          friendlyMessage = 'Ongeldig e-mailadres.';
        }
        
        toast.error('Registratie mislukt', { description: friendlyMessage });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold">Welkom</h1>
        <p className="text-sm text-muted-foreground">Creëer een Wish2Share-account</p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          {/* Voornaam */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voornaam</FormLabel>
                <FormControl>
                  <Input placeholder="Voornaam" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Achternaam */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Achternaam</FormLabel>
                <FormControl>
                  <Input placeholder="Achternaam" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Geboortedatum */}
          <FormField
            control={form.control}
            name="birthdate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geboortedatum</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    placeholder="dd-mm-jj" 
                    {...field} 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Man</SelectItem>
                    <SelectItem value="female">Vrouw</SelectItem>
                    <SelectItem value="other">Ander</SelectItem>
                    <SelectItem value="prefer-not-to-say">Liever niet zeggen</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Land + Locatie */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Land</FormLabel>
                  <FormControl>
                    <Input placeholder="Land" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locatie</FormLabel>
                  <FormControl>
                    <Input placeholder="Locatie" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* E-mail */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="leviotte@icloud.com" 
                    {...field} 
                    disabled={isPending}
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Wachtwoord */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wachtwoord</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="•••••••" 
                    {...field} 
                    disabled={isPending}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bevestig Wachtwoord */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bevestig Wachtwoord</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="•••••••" 
                    {...field} 
                    disabled={isPending}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button 
            disabled={isPending} 
            type="submit" 
            className="w-full mt-2"
            style={{ backgroundColor: '#6B8E23' }} // Olive green zoals je oude site
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </Form>
      
      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center text-sm">
          Heb je al een account?{' '}
          <button onClick={onSwitchToLogin} className="text-primary font-medium hover:underline">
            Log in
          </button>
        </div>
      )}
      
      {/* Terms */}
      <div className="text-center text-xs text-muted-foreground">
        Door het creëren van een nieuw account ga je akkoord met onze{' '}
        <a href="/terms-and-conditions" className="underline hover:text-primary">
          Gebruiksvoorwaarden
        </a>
      </div>
    </div>
  );
}