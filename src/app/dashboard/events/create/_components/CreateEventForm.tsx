// src/app/dashboard/events/create/_components/CreateEventForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// ------------- HULPFUNCTIES ---------------------

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
    id: typeof p.id === "string" ? p.id : "",          // Zorgt dat het altijd een string is
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
    email: '', // optioneel
    confirmed: true,
    role: "organizer",
    status: "accepted",
    addedAt: new Date().toISOString(),
    wishlistId: undefined,
    photoURL: profile.photoURL ?? undefined,
    profileId: profile.id,
  };
}

// ------ REACT COMPONENT 1-OP-1 PRODUCTIENIVEAU -------

interface CreateEventFormProps {
  currentUser: UserProfile;
  profiles: EventProfileOption[];
}

export default function CreateEventForm({ currentUser, profiles }: CreateEventFormProps) {
  const router = useRouter();
  // State: step-wizard

  // Organizer is standaard eerste profiel
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
      participantType: 'manual', // default
      maxParticipants: undefined,
      participants: defaultParticipants,
    },
    mode: 'onSubmit',
  });

  const {
    control, handleSubmit, watch, setValue, trigger, getValues, setError, clearErrors,
  } = form;
const step = watch('step');
  // Participant array & helpers
  const {
    fields: participantFields,
    append: appendParticipant,
    remove: removeParticipant,
  } = useFieldArray({ control, name: 'participants' });

  // Organizer steeds bovenaan
  useEffect(() => {
    const profileId = watch('organizerProfileId');
    const orgProfile = profiles.find(p => p.id === profileId);
    if (orgProfile) {
      setValue(
        'participants',
        [createOrganizerProfile(orgProfile), ...participantFields.slice(1)]
      );
    }
    // eslint-disable-next-line
  }, [watch('organizerProfileId')]);

  // --------- FLOW STAP 1: Infogegevens + opties -------

  function Step1() {
    const participantType = watch('participantType');
    return (
      <>
        <FormField control={control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Naam van het evenement *</FormLabel>
            <FormControl>
              <Input placeholder="Bijv. Kerstfeest Familie 2025" className="text-base" {...field} />
            </FormControl>
            <FormDescription>
              Kies een herkenbare naam voor je evenement
            </FormDescription>
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
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal text-base", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP", { locale: nl }) : <span>Kies een datum</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
  mode="single"
  selected={field.value ?? undefined}
  onSelect={d => {
    field.onChange(d ?? null);
    clearErrors("date");
  }}
  disabled={date => date < todayISO()}
  initialFocus
  locale={nl}
/>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
          {/* Tijd */}
          <FormField control={control} name="time" render={({ field }) => (
            <FormItem>
              <FormLabel>Tijd</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  value={field.value}
                  onChange={field.onChange}
                  className="text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Budget */}
        <FormField control={control} name="budget" render={({ field }) => (
          <FormItem>
            <FormLabel>Budget per persoon (€)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Bijv. 25"
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="text-base"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Beschrijving */}
        <FormField control={control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Beschrijving (optioneel)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Voeg extra details toe over het evenement, bijvoorbeeld dresscode, locatie, speciale instructies..."
                className="resize-none text-base min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Organizer profile */}
        <FormField control={control} name="organizerProfileId" render={({ field }) => (
          <FormItem>
            <FormLabel>Organisator *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecteer een profiel" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-base">
                    <div className="flex items-center gap-2">
                      {p.photoURL ? (
                        <img src={p.photoURL} alt={p.displayName} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-warm-olive/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-warm-olive">
                            {p.firstName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span>{p.displayName}</span>
                      {p.isMainProfile && (
                        <span className="text-xs text-muted-foreground">(Jij)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Wie organiseert dit evenement? (jezelf of een van je profielen)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {/* Draw names */}
        <FormField control={control} name="drawNames" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-warm-olive/20 bg-warm-olive/5 p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="flex items-center gap-2 text-base font-medium">
                <Gift className="w-4 h-4 text-warm-olive" />
                Lootjes trekken
              </FormLabel>
              <FormDescription className="text-sm">
                Als je de Secret Santa functie activeert, krijgen deelnemers automatisch iemand toegewezen om een cadeau voor te kopen
              </FormDescription>
            </div>
          </FormItem>
        )} />

        {/* Registration deadline (indien lootjes) */}
        {watch('drawNames') && (
          <FormField control={control} name="registrationDeadline" render={({ field }) => (
            <FormItem>
              <FormLabel>Registratiedeadline</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal text-base", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP", { locale: nl }) : <span>Kies een deadline</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ?? undefined}
                    onSelect={d => {
                      field.onChange(d ?? undefined);
                      clearErrors("registrationDeadline");
                    }}
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

        {/* Deelnametype: manual/self-register */}
        <FormField control={control} name="participantType" render={({ field }) => (
          <FormItem>
            <FormLabel>Manier van deelnemen</FormLabel>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={field.value === 'manual'}
                  onChange={() => field.onChange('manual')}
                  className="h-4 w-4 text-warm-olive focus:ring-warm-olive border-gray-300"
                />
                <span className="text-sm text-accent">Ik voeg de deelnemers manueel toe</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={field.value === 'self-register'}
                  onChange={() => field.onChange('self-register')}
                  className="h-4 w-4 text-warm-olive focus:ring-warm-olive border-gray-300"
                />
                <span className="text-sm text-accent">
                  Deelnemers registreren zichzelf met een link
                </span>
              </label>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Max deelnemers (indien self-register) */}
        {watch('participantType') === 'self-register' && (
          <FormField control={control} name="maxParticipants" render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum aantal deelnemers</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="text-base"
                  placeholder="Bijv. 12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* NEXT BUTTON */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Annuleren
          </Button>
          <Button
  type="button"
  onClick={async () => {
    const ok = await trigger();
    if (ok) setValue('step', 2);
  }}
>
            <Users className="w-4 h-4 mr-2" />
            {watch('participantType') === 'manual' ? 'Deelnemers toevoegen' : 'Event aanmaken'}
          </Button>
        </div>
      </>
    );
  }

  // --------- FLOW STAP 2: Participanten beheren ---------

  function Step2Manual() {
    return (
      <>
        <div className="space-y-4">
          {participantFields.map((participant, idx) => (
            <div key={participant.id} className="flex items-center space-x-4">
              <div className="flex-grow grid grid-cols-2 gap-4">
                <FormField
  control={control}
  name={`participants.${idx}.firstName`}
  render={({ field }) => (
    <Input
      {...field}
      placeholder="Voornaam"
      className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
      required
      disabled={idx === 0}
    />
  )}
/>
                <FormField
  control={control}
  name={`participants.${idx}.lastName`}
  render={({ field }) => (
    <Input
      {...field}
      placeholder="Achternaam"
      className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
      required
      disabled={idx === 0}
    />
  )}
/>
              </div>
              <button
                type="button"
                onClick={() => idx !== 0 && removeParticipant(idx)}
                className="text-[#b34c4c] hover:text-red-800"
                disabled={idx === 0} // Organizer nooit verwijderen
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <Button
  type="button"
  onClick={() => appendParticipant({
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    confirmed: false,
    role: "participant",
    status: "pending",
    email: '',
    addedAt: new Date().toISOString(),
    // (optioneel): wishlistId, photoURL, profileId kunnen undefined blijven
  })}
  className="w-full border border-gray-300 text-accent px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center mt-4"
>
  <Plus className="h-5 w-5 mr-2" />
  Deelnemer toevoegen
</Button>
        <div className="flex justify-end space-x-4 mt-8">
          <Button
  type="button"
  variant="outline"
  onClick={() => setValue('step', 1)}
>
  Ga terug
</Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-warm-olive to-cool-olive hover:from-cool-olive hover:to-warm-olive"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Event aanmaken
          </Button>
        </div>
      </>
    );
  }

// --------- SUBMIT HANDLER --------

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
    registrationDeadline: data.registrationDeadline instanceof Date
      ? data.registrationDeadline.toISOString()
      : data.registrationDeadline ?? null,
    // voeg extra fields toe indien nodig
  };

  try {
    const result = await createEventAction(payload);
    if (result?.success && result.eventId) {
      toast.success('Event aangemaakt!');
      router.push(`/dashboard/events/${result.eventId}`);
    } else {
      toast.error(result?.message || 'Fout bij aanmaken event');
    }
  } catch (err) {
    toast.error('Onbekende fout opgetreden');
  }
};

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && <Step1 />}
        {(step === 2 && watch('participantType') === 'manual') && <Step2Manual />}
      </form>
    </Form>
  );
}