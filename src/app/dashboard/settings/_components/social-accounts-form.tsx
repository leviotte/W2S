'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Globe, Instagram, Facebook, Linkedin } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

import { socialLinksSchema, type SocialLinks } from '@/types/user';
import { updateSocialLinks } from '../actions';


interface SocialAccountsFormProps {
  initialData: SocialLinks | null;
}

type SocialField = {
  name: keyof SocialLinks;
  label: string;
  placeholder: string;
  icon: React.ElementType;
}

const socialFields: SocialField[] = [
  { name: 'website', label: 'Website', placeholder: 'https://jouw-website.com', icon: Globe },
  { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/jouwprofiel', icon: Instagram },
  { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/jouwprofiel', icon: Facebook },
  { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/jouwprofiel', icon: Linkedin },
];


export function SocialAccountsForm({ initialData }: SocialAccountsFormProps) {
  const form = useForm<z.infer<typeof socialLinksSchema>>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      website: initialData?.website || '',
      instagram: initialData?.instagram || '',
      facebook: initialData?.facebook || '',
      linkedin: initialData?.linkedin || '',
    },
  });

  async function onSubmit(data: z.infer<typeof socialLinksSchema>) {
    toast.promise(updateSocialLinks(data), {
      loading: 'Bezig met opslaan...',
      success: (res) => res.message,
      error: (err: Error) => err.message,
    });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Sociale Accounts</CardTitle>
            <CardDescription>Link je sociale media en website om je profiel compleet te maken.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialFields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <field.icon className="h-4 w-4 text-muted-foreground" />
                      {field.label}
                    </FormLabel>
                    <FormControl>
                      {/* FIX 1: Zorg ervoor dat de waarde nooit 'null' is. */}
                      <Input 
                        placeholder={field.placeholder} 
                        {...formField} 
                        value={formField.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            {/* FIX 2: Gebruik de 'pending' prop i.p.v. 'isPending'. */}
            <SubmitButton pending={form.formState.isSubmitting}>Wijzigingen Opslaan</SubmitButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}