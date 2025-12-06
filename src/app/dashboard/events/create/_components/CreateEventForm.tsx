"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormState, useFormStatus } from "react-dom";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";

import { createEventAction, FormState } from "../actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import RequiredFieldMarker from "@/components/shared/RequiredFieldMarker";

// Props
interface CreateEventFormProps {
  categories: { id: string; name: string }[];
  backImages: { id: string; imageLink: string; title: string; category: string }[];
}

// Zod Schema
const formSchema = z.object({
    name: z.string().min(1, "Naam van het evenement is verplicht"),
    date: z.string().min(1, "Datum is verplicht"),
    time: z.string().optional(),
    backgroundImage: z.string().optional(),
    budget: z.coerce.number().positive("Budget moet een positief getal zijn.").optional(),
    isLootjesEvent: z.boolean().default(false),
    registrationDeadline: z.string().optional().nullable(),
    participantType: z.enum(["manual", "self-register"]).default("manual"),
    maxParticipants: z.coerce.number().positive("Aantal moet positief zijn.").optional(),
    participants: z.array(
        z.object({
          id: z.string(),
          firstName: z.string().min(1, "Voornaam is verplicht"),
          lastName: z.string().min(1, "Achternaam is verplicht"),
          email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
          confirmed: z.boolean(),
        })
    ).default([]),
})
.refine((data) => {
    if (!data.date) return true;
    const eventDateTime = new Date(`${data.date}T${data.time || "00:00"}`);
    eventDateTime.setHours(0, 0, 0, 0); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDateTime >= today;
}, { message: "Je kunt geen evenement in het verleden plannen.", path: ["date"] })
.refine((data) => {
    if (!data.registrationDeadline || !data.date) return true;
    const deadline = new Date(data.registrationDeadline);
    const eventDateTime = new Date(`${data.date}T${data.time || "00:00"}`);
    return deadline <= eventDateTime;
}, { message: "De deadline moet vóór of op de evenementdatum liggen.", path: ["registrationDeadline"] })
.refine((data) => {
    if (!data.isLootjesEvent || data.participantType !== "manual") return true;
    return data.participants.length >= 3;
}, { message: "Voeg minimaal 3 deelnemers toe voor een lootjes evenement.", path: ["participants"] });

type FormValues = z.infer<typeof formSchema>;

const initialState: FormState = { success: false, message: "" };

function SubmitButton({ text, pendingText }: { text: string, pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? pendingText : text}
    </Button>
  );
}

export function CreateEventForm({ categories, backImages }: CreateEventFormProps) {
  const router = useRouter();
  const { currentUser, profiles } = useAuthStore();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filteredImages, setFilteredImages] = useState(backImages);
  const formRef = useRef<HTMLFormElement>(null);

  const profile = typeof window !== "undefined" ? localStorage.getItem("activeProfile") : "main-account";
  const isMainProfile = profile === "main-account";
  const profileData = !isMainProfile ? profiles.find((i) => i?.id === profile) : null;

  const [state, formAction] = useFormState(createEventAction, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: "",
      time: "",
      backgroundImage: "",
      budget: undefined,
      isLootjesEvent: false,
      registrationDeadline: null,
      participantType: "manual",
      maxParticipants: undefined,
      participants: currentUser ? [{
          id: isMainProfile ? currentUser.id : profileData?.id || crypto.randomUUID(),
          firstName: isMainProfile ? currentUser.firstName : profileData?.firstName || "",
          lastName: isMainProfile ? currentUser.lastName : profileData?.lastName || "",
          email: currentUser.email || "",
          confirmed: true,
      }] : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "participants" });

  const watchIsLootjesEvent = form.watch("isLootjesEvent");
  const watchParticipantType = form.watch("participantType");
  const watchDate = form.watch("date");

  useEffect(() => {
    if (state.success && state.eventId) {
      toast.success(state.message);
      const data = form.getValues();
      const navPath = data.participantType === "manual" && data.participants.length > 1 ? `/dashboard/events/${state.eventId}/invites` : `/dashboard/events/${state.eventId}`;
      router.push(navPath);
    } else if (!state.success && state.message && state.message !== "") {
      toast.error(state.message);
    }
  }, [state, router, form]);
  
  useEffect(() => {
    setFilteredImages(selectedCategory ? backImages.filter(img => img.category === selectedCategory) : backImages);
  }, [selectedCategory, backImages]);

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof FormValues)[] = ["name", "date", "time", "registrationDeadline"];
    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) {
        toast.error("Controleer de gemarkeerde velden en probeer opnieuw.");
        return;
    }
    
    if (form.getValues("participantType") === 'self-register') {
      form.handleSubmit(() => {
        formRef.current?.requestSubmit();
      })();
    } else {
      setStep(2);
    }
  };

  return (
    <Form {...form}>
      <form ref={formRef} action={formAction} className="space-y-8">
        {step === 1 && (
          <>
            <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Naam evenement<RequiredFieldMarker /></FormLabel> <FormControl><Input placeholder="Bv: Kerst 2025" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="date" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Datum<RequiredFieldMarker /></FormLabel> <FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField name="time" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Tijd</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem> 
                    <Label>Categorie Achtergrond</Label> 
                    <Select onValueChange={setSelectedCategory} defaultValue="">
                        <SelectTrigger><SelectValue placeholder="Kies een categorie" /></SelectTrigger>
                        <SelectContent> 
                            <SelectItem value="">Alle categorieën</SelectItem> 
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)} 
                        </SelectContent> 
                    </Select> 
                </FormItem>
                <FormField name="backgroundImage" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Evenement Achtergrond</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Kies een achtergrond" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="">Geen achtergrond</SelectItem> {filteredImages.map(img => <SelectItem key={img.id} value={img.imageLink}>{img.title}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField name="budget" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Budget per persoon (€)</FormLabel> <FormControl><Input type="number" placeholder="Bv: 25" min="0" step="0.01" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <div className="space-y-4">
                <FormField name="isLootjesEvent" control={form.control} render={({ field }) => ( <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <div className="space-y-1 leading-none"> <FormLabel>Dit is een lootjes evenement</FormLabel> <FormDescription>Activeer namen trekken en verlanglijstjes.</FormDescription> </div> </FormItem> )}/>
                {watchIsLootjesEvent && <FormField name="registrationDeadline" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Registratie Deadline</FormLabel> <FormControl><Input type="date" max={watchDate} {...field} value={field.value ?? ""} /></FormControl> <FormMessage /> </FormItem> )}/>}
            </div>
            <FormField name="participantType" control={form.control} render={({ field }) => ( <FormItem className="space-y-3"> <FormLabel>Manier van deelnemen</FormLabel> <FormControl> <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1"> <FormItem className="flex items-center space-x-3 space-y-0"> <FormControl><RadioGroupItem value="manual" /></FormControl> <FormLabel className="font-normal">Ik voeg de deelnemers manueel toe</FormLabel> </FormItem> <FormItem className="flex items-center space-x-3 space-y-0"> <FormControl><RadioGroupItem value="self-register" /></FormControl> <FormLabel className="font-normal">Deelnemers registreren zelf met een link</FormLabel> </FormItem> </RadioGroup> </FormControl> <FormMessage /> </FormItem> )}/>
            {watchParticipantType === "self-register" && <FormField name="maxParticipants" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Maximum aantal deelnemers</FormLabel> <FormControl><Input type="number" placeholder="Bv: 50" min="1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>}
            <div className="flex justify-end"> <Button type="button" onClick={handleNextStep}>{watchParticipantType === 'self-register' ? 'Maak Evenement Aan' : 'Volgende'}</Button> </div>
          </>
        )}

        {step === 2 && (
          <>
            <div><h3 className="text-lg font-medium">Deelnemers</h3><p className="text-sm text-muted-foreground">Voeg de personen toe die zullen deelnemen.</p></div>
            <div className="space-y-4 rounded-md border p-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-2">
                  <div className="flex-grow grid grid-cols-2 gap-2">
                    <FormField name={`participants.${index}.firstName`} control={form.control} render={({ field }) => ( <FormItem> {index === 0 && <Label>Voornaam</Label>} <FormControl><Input placeholder="Voornaam" {...field} disabled={index===0} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField name={`participants.${index}.lastName`} control={form.control} render={({ field }) => ( <FormItem> {index === 0 && <Label>Achternaam</Label>} <FormControl><Input placeholder="Achternaam" {...field} disabled={index===0} /></FormControl> <FormMessage /> </FormItem> )}/>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={index === 0}> <X className="h-4 w-4" /> </Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: crypto.randomUUID(), firstName: "", lastName: "", email: "", confirmed: false })}> <Plus className="h-4 w-4 mr-2" /> Deelnemer toevoegen </Button>
            </div>
            <div className="flex justify-between items-center"> <Button type="button" variant="outline" onClick={() => setStep(1)}>Terug</Button> <SubmitButton text="Maak Evenement Aan" pendingText="Aanmaken..." /> </div>
          </>
        )}
      </form>
    </Form>
  );
}