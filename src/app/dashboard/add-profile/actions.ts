// src/app/dashboard/add-profile/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from '@/lib/auth/actions';
import { adminDb } from "@/lib/server/firebase-admin";
import { UserProfileSchema, type UserProfile } from "@/types/user";

const addProfileSchema = z.object({
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

  const validatedFields = addProfileSchema.safeParse({
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

  // Bouw het nieuwe sub-profiel object
  const newProfile: Omit<UserProfile, "id"> = {
      // Gebruik een unieke, maar herkenbare placeholder. Sub-profielen hebben geen eigen login.
      email: `${user.id}+subprofile_${Date.now()}@wish2share.com`,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      photoURL: null,
      isPublic: false,
      isAdmin: false,
      isPartner: false,
      ownerId: user.id, // Link naar het hoofdaccount
      managers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      socials: {}, // DE FIX: Moet een leeg object zijn, geen 'undefined'
  };

  try {
    const finalValidation = UserProfileSchema.omit({ id: true }).safeParse(newProfile);
    if(!finalValidation.success){
        console.error("Final profile validation failed:", finalValidation.error.flatten());
        return { success: false, message: "Interne data is inconsistent. Probeer opnieuw." };
    }

    await adminDb.collection("users").add(finalValidation.data);

    // Vertel Next.js welke data opnieuw moet worden opgehaald.
    // De layout toont de team switcher, dus die moet ververst worden.
    revalidatePath('/', 'layout');

    return { success: true, message: `Profiel voor ${firstName} is aangemaakt.` };

  } catch (error) {
    console.error("Fout bij aanmaken van sub-profiel:", error);
    return { success: false, message: "Een serverfout is opgetreden." };
  }
}