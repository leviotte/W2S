// src/components/auth/register-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClientAuth, getClientFirestore } from '@/lib/client/firebase';

const registerFormSchema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht.'),
  lastName: z.string().min(1, 'Achternaam is verplicht.'),
  birthDate: z.string().min(1, 'Geboortedatum is verplicht.'),
  gender: z.string().min(1, 'Gender is verplicht.'),
  country: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email('Ongeldig e-mailadres.'),
  password: z.string().min(6, 'Wachtwoord moet minstens 6 tekens bevatten.'),
  confirmPassword: z.string().min(1, 'Bevestig je wachtwoord.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen.',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ 
  onSuccess, 
  onSwitchToLogin,
}: RegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
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

  const onSubmit = (data: RegisterFormValues) => {
    startTransition(async () => {
      try {
        const auth = getClientAuth();
        const db = getClientFirestore();
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          data.email, 
          data.password
        );
        
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate,
          gender: data.gender,
          country: data.country || '',
          location: data.location || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Send email verification
        await sendEmailVerification(user);

        toast.success('Account aangemaakt!', {
          description: 'Controleer je inbox om je e-mail te verifiëren.',
        });

        // Sign out user until email is verified
        await auth.signOut();

        if (onSuccess) {
          onSuccess();
        }

        // Optioneel: redirect naar login
        if (onSwitchToLogin) {
          setTimeout(() => onSwitchToLogin(), 1500);
        }

      } catch (error: any) {
        console.error("Firebase registration error:", error);
        
        let errorMessage = 'Er is een onbekende fout opgetreden.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Dit e-mailadres is al in gebruik.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Wachtwoord is te zwak. Gebruik minstens 6 tekens.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Ongeldig e-mailadres.';
        }
        
        toast.error('Registratie mislukt', { description: errorMessage });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Welkom</h1>
        <p className="text-sm text-gray-600">Creëer een Wish2Share-account</p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          
          {/* Voornaam */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Voornaam</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Voornaam" 
                    {...field} 
                    disabled={isPending}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
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
                <FormLabel className="text-gray-700">Achternaam</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Achternaam" 
                    {...field} 
                    disabled={isPending}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Geboortedatum */}
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Geboortedatum</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    placeholder="dd-mm-jj" 
                    {...field} 
                    disabled={isPending}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
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
                <FormLabel className="text-gray-700">Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                      <SelectValue placeholder="Geslacht" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Man</SelectItem>
                    <SelectItem value="female">Vrouw</SelectItem>
                    <SelectItem value="other">Andere</SelectItem>
                    <SelectItem value="prefer-not-to-say">Zeg ik liever niet</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Land + Locatie - 2 KOLOMMEN zoals productie */}
          <div className="grid grid-cols-2 gap-3">
            {/* Land */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Land</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Land" 
                      {...field} 
                      disabled={isPending}
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Locatie */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Locatie</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Locatie" 
                      {...field} 
                      disabled={isPending}
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
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
                <FormLabel className="text-gray-700">E-mail</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="naam@voorbeeld.com" 
                    {...field} 
                    autoComplete="email"
                    disabled={isPending}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
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
                <FormLabel className="text-gray-700">Wachtwoord</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      {...field} 
                      autoComplete="new-password"
                      disabled={isPending}
                      className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
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
                <FormLabel className="text-gray-700">Bevestig Wachtwoord</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      {...field} 
                      autoComplete="new-password"
                      disabled={isPending}
                      className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isPending}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Create Account Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#6B8E23] hover:bg-[#5a7a1c] text-white" 
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </Form>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center text-sm text-gray-600">
          Heb je al een account?{' '}
          <button 
            onClick={onSwitchToLogin} 
            className="text-[#6B8E23] font-medium hover:underline"
            disabled={isPending}
          >
            Log in
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Door het creëren van een nieuw account ga je akkoord met onze{' '}
        <a 
          href="/terms-and-conditions" 
          className="underline hover:text-[#6B8E23]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Gebruiksvoorwaarden
        </a>
      </div>
    </div>
  );
}