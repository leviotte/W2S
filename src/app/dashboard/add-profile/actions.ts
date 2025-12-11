"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from '@/lib/auth/actions';
import { adminDb } from "@/lib/server/firebase-admin";
import { subProfileSchema, type SubProfile } from "@/types/user";

const addProfileFormSchema = z.object({
  firstName: z.string().min(2, "Voornaam moet minstens 2 karakters hebben."),
  lastName: z.string().min(2, "Achternaam moet minstens 2 karakters hebben."),
});

export type AddProfileFormState = {
  success: boolean;
  message: string;
  errors?: {
      firstName?: string[];
      lastName?: string[];
      _form?: string[];
  };
};

export async function addProfile(
  prevState: AddProfileFormState,
  formData: FormData
): Promise<AddProfileFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Authenticatie mislukt. Log opnieuw in." };
  }

  const validatedFields = addProfileFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validatie mislukt.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { firstName, lastName } = validatedFields.data;

  // BEST PRACTICE: Bouw het nieuwe sub-profiel object
  // SubProfile heeft GEEN email/isAdmin/isPartner - die zijn exclusief voor UserProfile
  const newSubProfile: Omit<SubProfile, "id"> = {
      userId: user.id, // De eigenaar (Firebase UID van het hoofdaccount)
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      photoURL: null,
      birthdate: null,
      gender: null,
      parentId: user.id, // Optionele extra link (kan handig zijn voor queries)
  };

  try {
    // Valideer tegen het SubProfile schema (zonder 'id')
    const finalValidation = subProfileSchema.omit({ id: true }).safeParse(newSubProfile);
    
    if (!finalValidation.success) {
        console.error("SubProfile validation failed:", finalValidation.error.flatten());
        return { 
          success: false, 
          message: "Interne validatie mislukt. Controleer de ingevoerde gegevens.",
          errors: { _form: ["Data validatie fout"] }
        };
    }

    // BEST PRACTICE: SubProfiles gaan in een aparte collectie 'profiles'
    // Zo blijft 'users' collection schoon met enkel hoofdaccounts
    const docRef = await adminDb.collection("profiles").add(finalValidation.data);

    console.log(`✅ SubProfile created with ID: ${docRef.id}`);

    // Revalideer alle dashboard layouts (voor TeamSwitcher)
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/', 'layout');

    return { 
      success: true, 
      message: `Profiel voor ${firstName} is succesvol aangemaakt!` 
    };

  } catch (error) {
    console.error("Fout bij aanmaken van sub-profiel:", error);
    return { 
      success: false, 
      message: "Een serverfout is opgetreden. Probeer het opnieuw.",
      errors: { _form: ["Database fout"] }
    };
  }
}