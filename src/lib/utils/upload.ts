import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/client/firebase';

// ============================================================================
// TYPES
// ============================================================================

type UploadProgressCallback = (progress: number) => void;

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload een blog afbeelding naar Firebase Storage
 */
export async function uploadBlogImage(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const storage = getStorage(app);
  const fileName = `public/posts/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Upload mislukt'));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload een profiel afbeelding
 */
export async function uploadProfileImage(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const storage = getStorage(app);
  const fileName = `profileImages/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Upload mislukt'));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload een event/wishlist afbeelding
 */
export async function uploadEventImage(
  file: File,
  eventId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const storage = getStorage(app);
  const fileName = `events/${eventId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Upload mislukt'));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}