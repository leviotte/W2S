'use server';

import { adminStorage } from '@/lib/server/firebase-admin';

export async function uploadFileAction(
  file: File,
  destinationPath: string
): Promise<string> {
  try {
    const bucket = adminStorage.bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileRef = bucket.file(destinationPath);

    await fileRef.save(fileBuffer, {
      metadata: { contentType: file.type },
    });

    // Optioneel: maak het bestand publiek of genereer signed URL
    await fileRef.makePublic();

    return fileRef.publicUrl();
  } catch (error) {
    console.error('Upload mislukt:', error);
    throw new Error('Bestandsupload is mislukt');
  }
}
