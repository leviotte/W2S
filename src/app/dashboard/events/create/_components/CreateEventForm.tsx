// src/app/dashboard/events/create/_components/CreateEventForm.tsx
"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createEventAction, type FormState } from "@/app/dashboard/events/create/actions";
import type { UserProfile } from "@/types/user";
import type { EventProfileOption } from "@/types/event";

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
import { CalendarIcon, Users, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

// ✅ VALIDATION SCHEMA
const eventFormSchema = z.object({
  name: z.string().min(3, { message: "Naam moet minimaal 3 karakters lang zijn." }),
  date: z.date().nullable().refine(date => date !== null, {
    message: "Een datum is verplicht.",
  }),
  description: z.string().optional(),
  organizerProfileId: z.string().min(1, { message: "Kies een organisator." }),
  drawNames: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface CreateEventFormProps {
  currentUser: UserProfile;
  profiles: EventProfileOption[];
}

const initialState: FormState = { success: false, message: "" };

export default function CreateEventForm({ currentUser, profiles }: CreateEventFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(createEventAction, initialState);

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

  // ✅ HANDLE SERVER RESPONSE
  useEffect(() => {
    if (state.success && state.eventId) {
      toast.success(state.message || "Evenement succesvol aangemaakt!");
      router.push(`/dashboard/events/${state.eventId}`);
    } else if (!state.success && state.message) {
      if (state.errors) {
        Object.entries(state.errors).forEach(([key, value]) => {
          form.setError(key as keyof EventFormData, { 
            type: "server", 
            message: value?.join(', ') 
          });
        });
      } else {
        toast.error("Oeps!", { description: state.message });
      }
    }
  }, [state, router, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        {/* HIDDEN FIELD: organizerEmail */}
        <input type="hidden" name="organizerEmail" value={currentUser.email} />
        
        {/* EVENT NAME */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naam van het evenement *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Bv. Kerstfeest Familie 2025" 
                  className="text-base"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Kies een herkenbare naam voor je evenement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DATE PICKER */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full pl-3 text-left font-normal text-base",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: nl })
                      ) : (
                        <span>Kies een datum</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={field.value ?? undefined} 
                    onSelect={field.onChange} 
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus 
                    locale={nl}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Wanneer vindt het evenement plaats?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DESCRIPTION */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
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
          )}
        />

        {/* ORGANIZER PROFILE */}
        <FormField
          control={form.control}
          name="organizerProfileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisator *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <img 
                            src={p.photoURL} 
                            alt={p.displayName} 
                            className="w-6 h-6 rounded-full object-cover"
                          />
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
          )}
        />

        {/* DRAW NAMES CHECKBOX */}
        <FormField
          control={form.control}
          name="drawNames"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-warm-olive/20 bg-warm-olive/5 p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <Gift className="w-4 h-4 text-warm-olive" />
                  Lootjes trekken
                </FormLabel>
                <FormDescription className="text-sm">
                  Activeer de Secret Santa functie - deelnemers krijgen automatisch iemand toegewezen om een cadeau voor te kopen
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* SUBMIT BUTTON */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            className="flex-1"
          >
            Annuleren
          </Button>
          <SubmitButton className="flex-1 bg-gradient-to-r from-warm-olive to-cool-olive hover:from-cool-olive hover:to-warm-olive">
            <Sparkles className="w-4 h-4 mr-2" />
            Evenement Aanmaken
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}