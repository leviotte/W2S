// src/app/dashboard/events/create/_components/CreateEventForm.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/user';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
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
import { eventFormSchema, EventFormData, EventParticipant, EventProfileOption } from '@/types/event';

// ---------------- HULPFUNCTIES ------------------

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function prepareParticipants(
  participants: (Partial<EventParticipant> & { email?: string })[],
  organizerProfileId: string
): EventParticipant[] {
  return participants.map((p, idx): EventParticipant => ({
    ...p,
    id: typeof p.id === "string" ? p.id : "",
    firstName: typeof p.firstName === "string" ? p.firstName : "",
    lastName: typeof p.lastName === "string" ? p.lastName : "",
    role: idx === 0 ? "organizer" : "participant",
    status: "accepted",
    confirmed: !!p.confirmed,
    addedAt: p.addedAt ?? new Date().toISOString(),
    wishlistId: p.wishlistId ?? undefined,
    photoURL: p.photoURL ?? undefined,
    profileId: p.profileId ?? undefined,
    email: p.email ?? "",
  }));
}

function createOrganizerProfile(profile: EventProfileOption): EventParticipant {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: '',
    confirmed: true,
    role: "organizer",
    status: "accepted",
    addedAt: new Date().toISOString(),
    wishlistId: undefined,
    photoURL: profile.photoURL ?? undefined,
    profileId: profile.id,
  };
}

// ---------------- COMPONENT ------------------

interface CreateEventFormProps {
  currentUser: UserProfile;
  profiles: EventProfileOption[];
}

export default function CreateEventForm({ currentUser, profiles }: CreateEventFormProps) {
  const router = useRouter();

  const organizerProfile = profiles.find(p => p.id === currentUser.id) || profiles[0];
  const defaultParticipants: EventParticipant[] = [createOrganizerProfile(organizerProfile)];

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      step: 1,
      name: '',
      date: null,
      time: '',
      description: '',
      budget: undefined,
      organizerProfileId: organizerProfile.id,
      drawNames: false,
      registrationDeadline: null,
      participantType: 'manual',
      maxParticipants: undefined,
      participants: defaultParticipants,
    },
    mode: 'onSubmit',
  });

  const {
    control, handleSubmit, watch, setValue, trigger, clearErrors,
  } = form;

  const step = watch('step');

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: 'participants',
  });

  // Organizer bovenaan houden, safe versie
useEffect(() => {
  const organizerProfile = profiles.find(p => p.id === form.getValues('organizerProfileId'));
  if (!organizerProfile) return;

  const currentParticipants = form.getValues('participants');

  // Alleen aanpassen als organizer nog niet bovenaan staat
  if (!currentParticipants[0] || currentParticipants[0].profileId !== organizerProfile.id) {
    form.setValue('participants', [
      createOrganizerProfile(organizerProfile),
      ...currentParticipants.filter(p => p.profileId !== organizerProfile.id),
    ], { shouldValidate: false });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [form, profiles]);

  // ---------------- STEP 1 ------------------

  function Step1() {
    const participantType = watch('participantType');

    return (
      <>
        <FormField control={control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Naam van het evenement *</FormLabel>
            <FormControl>
              <Input placeholder="Bijv. Kerstfeest Familie 2025" {...field} />
            </FormControl>
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
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
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
                min="0"
                step="0.01"
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

        <FormField control={control} name="organizerProfileId" render={({ field }) => (
          <FormItem>
            <FormLabel>Organisator *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een profiel" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      {p.photoURL ? (
                        <img src={p.photoURL} alt={p.displayName} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-warm-olive/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-warm-olive">{p.firstName.charAt(0)}</span>
                        </div>
                      )}
                      <span>{p.displayName}</span>
                      {p.isMainProfile && <span className="text-xs text-muted-foreground">(Jij)</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>Wie organiseert dit evenement?</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={control} name="drawNames" render={({ field }) => (
          <FormItem className="flex items-start space-x-3 rounded-lg border p-4 bg-warm-olive/5">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
            </FormControl>
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
                    onSelect={d => { field.onChange(d ?? undefined); clearErrors("registrationDeadline"); }}
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

        {participantType === 'self-register' && (
          <FormField control={control} name="maxParticipants" render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum aantal deelnemers</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Annuleren</Button>
          <Button type="button" onClick={async () => { if (await trigger()) setValue('step', 2); }}>
            <Users className="w-4 h-4 mr-2" />
            {participantType === 'manual' ? 'Deelnemers toevoegen' : 'Event aanmaken'}
          </Button>
        </div>
      </>
    );
  }

  // ---------------- STEP 2: MANUAL ------------------

  function Step2Manual() {
    return (
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
  }
// ---------------- STEP 2: SELF-REGISTER ------------------

  function Step2SelfRegister() {
    const maxParticipants = watch('maxParticipants');

    return (
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
  }
  // ---------------- SUBMIT ------------------

  const onSubmit = async (data: EventFormData) => {
    const enrichedParticipants = prepareParticipants(data.participants, data.organizerProfileId);

    const payload = {
      name: data.name,
      date: data.date instanceof Date ? data.date.toISOString() : String(data.date),
      time: data.time ?? null,
      endTime: null,
      organizerProfileId: data.organizerProfileId,
      organizer: currentUser.id,
      budget: data.budget ?? 0,
      maxParticipants: data.maxParticipants ?? 1000,
      isLootjesEvent: data.drawNames,
      allowSelfRegistration: data.participantType === 'self-register',
      participants: enrichedParticipants,
      registrationDeadline: data.registrationDeadline instanceof Date ? data.registrationDeadline.toISOString() : data.registrationDeadline ?? null,
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

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && <Step1 />}
        {step === 2 && watch('participantType') === 'manual' && <Step2Manual />}
        {step === 2 && watch('participantType') === 'self-register' && <Step2SelfRegister />}
      </form>
    </Form>
  );
}