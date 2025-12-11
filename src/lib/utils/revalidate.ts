// src/lib/utils/revalidate.ts
import { revalidatePath as nextRevalidatePath, revalidateTag as nextRevalidateTag } from 'next/cache';

/**
 * Wrapper voor Next.js 16 revalidateTag
 * In Next.js 16 is de tweede parameter optioneel
 */
export function revalidateTag(tag: string): void {
  // @ts-expect-error - Next.js 16 heeft breaking change in types maar API werkt met 1 argument
  nextRevalidateTag(tag);
}

/**
 * Wrapper voor Next.js 16 revalidatePath
 */
export function revalidatePath(path: string, type?: 'page' | 'layout'): void {
  nextRevalidatePath(path, type);
}

/**
 * Revalidate multiple tags at once
 */
export function revalidateTags(tags: string[]): void {
  tags.forEach(tag => revalidateTag(tag));
}

/**
 * Revalidate multiple paths at once
 */
export function revalidatePaths(paths: string[], type?: 'page' | 'layout'): void {
  paths.forEach(path => revalidatePath(path, type));
}