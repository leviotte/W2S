// src/app/dashboard/events/create/_components/CreateEventForm.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createEventAction, type FormState } from "@/app/dashboard/events/create/actions";
import type { UserProfile } from "@/types/user";

// UI imports
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ** DE FIX **: Correcte Zod syntax voor alle velden.
const eventFormSchema = z.object({
  name: z.string().min(3, { message: "Naam moet minimaal 3 karakters lang zijn." }),
  date: z.date().nullable().refine(date => date !== null, {
    message: "Een datum is verplicht.",
  }),
  description: z.string().optional(),
  organizerProfileId: z.string().min(1, { message: "Kies een organisator." }), // Correcte syntax voor 'required'
  drawNames: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface CreateEventFormProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
}

const initialState: FormState = { success: false, message: "" };

export default function CreateEventForm({ currentUser, profiles }: CreateEventFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(createEventAction, initialState);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      date: null,
      description: "",
      organizerProfileId: currentUser.id,
      drawNames: false,
    },
  });

  useEffect(() => {
    if (state.success && state.eventId) {
      toast.success(state.message);
      router.push(`/dashboard/event/${state.eventId}`);
    } else if (!state.success && state.message) {
      if (state.errors) {
        Object.entries(state.errors).forEach(([key, value]) => {
          form.setError(key as keyof EventFormData, { type: "server", message: value?.join(', ') });
        });
      } else {
        toast.error("Oeps!", { description: state.message });
      }
    }
  }, [state, router, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <input type="hidden" name="organizerEmail" value={currentUser.email} />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naam van het evenement</FormLabel>
              <FormControl><Input placeholder="Bv. Kerstfeest Familia" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Kies een datum</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} disabled={(date) => date < new Date() || date < new Date("1900-01-01")} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschrijving (optioneel)</FormLabel>
              <FormControl><Textarea placeholder="Voeg extra details toe over het evenement..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organizerProfileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisator</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecteer een profiel" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <FormDescription>Kies wie het evenement organiseert.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="drawNames"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>Lootjes trekken</FormLabel>
                    <FormDescription>Activeer de functionaliteit om lootjes te trekken voor dit evenement.</FormDescription>
                </div>
            </FormItem>
          )}
        />
        <SubmitButton>Evenement Aanmaken</SubmitButton>
      </form>
    </Form>
  );
}