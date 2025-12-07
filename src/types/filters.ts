// src/types/filters.ts
import { z } from 'zod';

// Strikte definities ZONDER 'undefined'. Dit zorgt voor maximale type-veiligheid.
// Een property kan optioneel zijn, maar het type zelf is strikt.
export const ageGroupSchema = z.enum(['baby', 'toddler', 'child', 'teen', 'adult', 'senior']);
export const genderSchema = z.enum(['male', 'female', 'unisex']);

export type AgeGroup = z.infer<typeof ageGroupSchema>;
export type Gender = z.infer<typeof genderSchema>;

// Helper om een string te valideren tegen onze AgeGroup enum
export const isAgeGroup = (value: string | undefined): value is AgeGroup => {
    return ageGroupSchema.safeParse(value).success;
}

// Helper om een string te valideren tegen onze Gender enum
export const isGender = (value: string | undefined): value is Gender => {
    return genderSchema.safeParse(value).success;
}