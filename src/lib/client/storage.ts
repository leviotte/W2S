// src/lib/client/storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/client/firebase'; // We gebruiken de client-side firebase app

const storage = getStorage(app);

/**
 * Uploadt een bestand naar Firebase Storage vanaf de client.
 * @param file Het File-object dat geüpload moet worden.
 * @param path Het pad in de storage bucket (bv. 'profile-pictures/user-id-123').
 * @returns De openbare download-URL van het geüploade bestand.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    console.log('File uploaded successfully!', snapshot);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Fout tijdens het uploaden van het bestand:", error);
    // Afhankelijk van de error-handling strategie, kan je hier een specifieke fout gooien.
    throw new Error('Bestandsupload is mislukt.');
  }
}