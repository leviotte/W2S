// src/app/dashboard/events/create/_components/CreateEventForm.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/user';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Plus, X, Gift, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createEventAction } from '@/lib/server/actions/events';
import type { EventParticipant, EventProfileOption, Event } from '@/types/event';
import { eventSchema } from '@/types/event';

// ============================================================================
// FORM TYPES
// ============================================================================
interface FormValues {
  step: number;
  participantType: 'manual' | 'self-register';
  name: string;
  description: string;
  date: Date | null;
  time: string;
  budget?: number;
  maxParticipants?: number;
  drawNames: boolean;
  registrationDeadline: Date | null;
  participants: Partial<EventParticipant>[];
}

// ============================================================================
// HELPERS
// ============================================================================
const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const createOrganizerProfile = (profile: EventProfileOption): Partial<EventParticipant> => ({
  id: profile.id,
  firstName: profile.firstName,
  lastName: profile.lastName,
  email: '',
  confirmed: true,
  role: 'organizer',
  status: 'accepted',
  addedAt: new Date().toISOString(),
  wishlistId: undefined,
  photoURL: profile.photoURL ?? undefined,
  profileId: profile.id,
  name: profile.displayName,
});

const prepareParticipants = (participants: Partial<EventParticipant>[]): EventParticipant[] =>
  participants.map((p, idx) => ({
    ...p,
    id: p.id ?? crypto.randomUUID(),
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    role: idx === 0 ? 'organizer' : p.role ?? 'participant',
    status: p.status ?? 'pending',
    confirmed: p.confirmed ?? false,
    addedAt: p.addedAt ?? new Date().toISOString(),
    wishlistId: p.wishlistId ?? undefined,
    photoURL: p.photoURL ?? undefined,
    profileId: p.profileId ?? undefined,
    email: p.email ?? '',
  }));

// ============================================================================
// COMPONENT
// ============================================================================
interface CreateEventFormProps {
  currentUser: UserProfile;
  profiles: EventProfileOption[];
}

export default function CreateEventForm({ currentUser, profiles }: CreateEventFormProps) {
  const router = useRouter();

  const organizerProfile = useMemo(
    () => profiles.find(p => p.id === currentUser.id) ?? profiles[0],
    [profiles, currentUser]
  );

  const defaultParticipants: Partial<EventParticipant>[] = [createOrganizerProfile(organizerProfile)];

  const form = useForm<FormValues>({
    resolver: zodResolver(eventSchema.pick({
      name: true,
      description: true,
      date: true,
      time: true,
      budget: true,
      maxParticipants: true,
      drawNames: true,
      registrationDeadline: true,
      participants: true,
      participantType: true,
    })),
    defaultValues: {
      step: 1,
      participantType: 'manual',
      name: '',
      description: '',
      date: null,
      time: '',
      budget: undefined,
      maxParticipants: undefined,
      drawNames: false,
      registrationDeadline: null,
      participants: defaultParticipants,
    },
    mode: 'onSubmit',
  });

  const { control, handleSubmit, watch, setValue, trigger, clearErrors } = form;
  const step = watch('step');
  const participantType = watch('participantType');

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: 'participants',
  });

  // Ensure organizer is always first
  useEffect(() => {
    const currentOrganizer = profiles.find(p => p.id === form.getValues().participants[0]?.profileId) ?? profiles[0];
    const currentParticipants = form.getValues().participants;
    if (currentParticipants[0]?.profileId !== currentOrganizer.id) {
      form.setValue('participants', [
        createOrganizerProfile(currentOrganizer),
        ...currentParticipants.filter(p => p.profileId !== currentOrganizer.id),
      ], { shouldValidate: false });
    }
  }, [form, profiles]);

  // ========================================================================
  // FORM SUBMIT
  // ========================================================================
  const onSubmit = async (data: FormValues) => {
    const enrichedParticipants = prepareParticipants(data.participants);

    const payload: Partial<Event> = {
      name: data.name,
      description: data.description,
      date: data.date?.toISOString() ?? undefined,
      time: data.time ?? null,
      endTime: null,
      organizer: currentUser.id,
      budget: data.budget ?? 0,
      maxParticipants: data.maxParticipants ?? 1000,
      isLootjesEvent: data.drawNames,
      allowSelfRegistration: data.participantType === 'self-register',
      participants: enrichedParticipants,
      registrationDeadline: data.registrationDeadline?.toISOString() ?? null,
    };

    try {
      const result = await createEventAction(payload);
      if (result?.success && result.eventId) {
        toast.success('Event aangemaakt!');
        router.push(`/dashboard/event/${result.eventId}`);
      } else {
        toast.error(result?.message || 'Fout bij aanmaken event');
      }
    } catch {
      toast.error('Onbekende fout opgetreden');
    }
  };

  // ========================================================================
  // STEP COMPONENTS
  // ========================================================================
  const Step1 = () => (
    <>
      <FormField control={control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Naam van het evenement *</FormLabel>
          <FormControl><Input placeholder="Bijv. Kerstfeest Familie 2025" {...field} /></FormControl>
          <FormDescription>Kies een herkenbare naam voor je evenement</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-2 gap-4">
        <FormField control={control} name="date" render={({ field }) => (
          <FormItem>
            <FormLabel>Datum *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={cn("w-full text-left", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP", { locale: nl }) : <span>Kies een datum</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ?? undefined}
                  onSelect={d => { field.onChange(d ?? null); clearErrors("date"); }}
                  disabled={date => date < todayISO()}
                  initialFocus
                  locale={nl}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={control} name="time" render={({ field }) => (
          <FormItem>
            <FormLabel>Tijd</FormLabel>
            <FormControl><Input type="time" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={control} name="budget" render={({ field }) => (
        <FormItem>
          <FormLabel>Budget per persoon (€)</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={field.value ?? ''}
              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Bijv. 25"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>Beschrijving (optioneel)</FormLabel>
          <FormControl>
            <Textarea placeholder="Extra details..." {...field} className="min-h-[100px]" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="drawNames" render={({ field }) => (
        <FormItem className="flex items-start space-x-3 rounded-lg border p-4 bg-warm-olive/5">
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" /></FormControl>
          <div className="space-y-1">
            <FormLabel className="flex items-center gap-2"><Gift className="w-4 h-4" />Lootjes trekken</FormLabel>
            <FormDescription>Deelnemers krijgen automatisch iemand toegewezen om een cadeau te kopen</FormDescription>
          </div>
        </FormItem>
      )} />

      {watch('drawNames') && (
        <FormField control={control} name="registrationDeadline" render={({ field }) => (
          <FormItem>
            <FormLabel>Registratiedeadline</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={cn("w-full text-left", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP", { locale: nl }) : <span>Kies een deadline</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ?? undefined}
                  onSelect={d => { field.onChange(d ?? null); clearErrors("registrationDeadline"); }}
                  disabled={date => {
                    const eventDate = watch('date');
                    return date < todayISO() || (eventDate instanceof Date && date >= eventDate);
                  }}
                  initialFocus
                  locale={nl}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />
      )}

      <FormField control={control} name="participantType" render={({ field }) => (
        <FormItem>
          <FormLabel>Manier van deelnemen</FormLabel>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input type="radio" checked={field.value === 'manual'} onChange={() => field.onChange('manual')} />
              <span>Ik voeg de deelnemers manueel toe</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="radio" checked={field.value === 'self-register'} onChange={() => field.onChange('self-register')} />
              <span>Deelnemers registreren zichzelf met een link</span>
            </label>
          </div>
          <FormMessage />
        </FormItem>
      )} />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Annuleren</Button>
        <Button type="button" onClick={async () => { if (await trigger()) setValue('step', 2); }}>
          <Users className="w-4 h-4 mr-2" />
          {participantType === 'manual' ? 'Deelnemers toevoegen' : 'Event aanmaken'}
        </Button>
      </div>
    </>
  );

  const Step2Manual = () => (
    <>
      <div className="space-y-4">
        {participantFields.map((participant, idx) => (
          <div key={participant.id} className="flex items-center space-x-4">
            <div className="flex-grow grid grid-cols-2 gap-4">
              <FormField control={control} name={`participants.${idx}.firstName`} render={({ field }) => (
                <Input {...field} placeholder="Voornaam" required disabled={idx === 0} />
              )} />
              <FormField control={control} name={`participants.${idx}.lastName`} render={({ field }) => (
                <Input {...field} placeholder="Achternaam" required disabled={idx === 0} />
              )} />
            </div>
            <button type="button" onClick={() => idx !== 0 && removeParticipant(idx)} disabled={idx === 0}>
              <X className="h-5 w-5 text-red-600" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" onClick={() => appendParticipant({
        id: crypto.randomUUID(),
        firstName: '',
        lastName: '',
        confirmed: false,
        role: "participant",
        status: "pending",
        email: '',
        addedAt: new Date().toISOString(),
      })} className="w-full flex items-center justify-center mt-4">
        <Plus className="h-5 w-5 mr-2" />Deelnemer toevoegen
      </Button>

      <div className="flex justify-end space-x-4 mt-8">
        <Button type="button" variant="outline" onClick={() => setValue('step', 1)}>Ga terug</Button>
        <Button type="submit" className="bg-gradient-to-r from-warm-olive to-cool-olive hover:from-cool-olive hover:to-warm-olive">
          <Sparkles className="w-4 h-4 mr-2" />Event aanmaken
        </Button>
      </div>
    </>
  );

  const Step2SelfRegister = () => (
    <>
      <FormField control={control} name="maxParticipants" render={({ field }) => (
        <FormItem>
          <FormLabel>Maximum aantal deelnemers</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={field.value ?? ''}
              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Bijv. 12"
            />
          </FormControl>
          <FormDescription>
            Stel een limiet op hoeveel deelnemers zichzelf kunnen registreren.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <div className="flex justify-end space-x-4 mt-8">
        <Button type="button" variant="outline" onClick={() => setValue('step', 1)}>Ga terug</Button>
        <Button type="submit" className="bg-gradient-to-r from-warm-olive to-cool-olive hover:from-cool-olive hover:to-warm-olive">
          <Sparkles className="w-4 h-4 mr-2" />Event aanmaken
        </Button>
      </div>
    </>
  );

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && <Step1 />}
        {step === 2 && participantType === 'manual' && <Step2Manual />}
        {step === 2 && participantType === 'self-register' && <Step2SelfRegister />}
      </form>
    </FormProvider>
  );
}
