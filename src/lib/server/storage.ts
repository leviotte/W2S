// src/lib/server/storage.ts
import { adminStorage } from './firebase-admin'; // We gaan ervan uit dat je storage hier geïnitialiseerd is

/**
 * Uploadt een bestand naar Firebase Storage.
 * @param file Het bestand om te uploaden.
 * @param destinationPath Het pad in de bucket (bv. 'profile-pictures/user-id.jpg').
 * @returns De publieke URL van het geüploade bestand.
 */
export async function uploadFileToStorage(file: File, destinationPath: string): Promise<string> {
    const bucket = adminStorage.bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileRef = bucket.file(destinationPath);

    await fileRef.save(fileBuffer, {
        metadata: {
            contentType: file.type,
        },
    });
    
    // Maak het bestand publiek leesbaar
    await fileRef.makePublic();
    
    // Return de publieke URL
    return fileRef.publicUrl();
}