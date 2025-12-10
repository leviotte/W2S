import { toast } from 'sonner';

/**
 * Opties voor het configureren van de beeldcompressie.
 */
interface ImageCompressionOptions {
  /** Maximale breedte of hoogte in pixels. Default: 1024. */
  maxWidthOrHeight?: number;
  /** Compressiekwaliteit voor JPEG (0.0 - 1.0). Default: 0.7. */
  quality?: number;
  /** Maximale bestandsgrootte in MB voor de waarschuwing. Default: 1. */
  maxSizeMB?: number;
}

/**
 * Comprimeert een afbeeldingsbestand.
 * De functie is nu configureerbaar via een optioneel 'options' object.
 * @param file - Het afbeeldingsbestand om te comprimeren.
 * @param options - Optionele configuratie voor de compressie.
 * @returns Promise<File> - Het gecomprimeerde afbeeldingsbestand.
 */
export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  // Stel standaardwaarden in en overschrijf ze met de meegegeven opties.
  const {
    maxWidthOrHeight = 1024,
    quality = 0.7,
    maxSizeMB = 1,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Kon het bestand niet lezen.'));
      }

      const img = new Image();
      img.src = event.target.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Kon geen canvas context verkrijgen.'));
        }

        // Beeldverhouding behouden
        let { width, height } = img;
        const maxDim = maxWidthOrHeight;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Beeldcompressie mislukt.'));
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            // Waarschuw als de afbeelding nog steeds te groot is, gebaseerd op de opties.
            if (compressedFile.size > maxSizeMB * 1024 * 1024) {
              toast.warning(
                `De afbeelding is na compressie nog steeds groter dan ${maxSizeMB}MB. Overweeg een kleiner bestand.`
              );
            }

            resolve(compressedFile);
          },
          'image/jpeg',
          quality // Gebruik de configureerbare kwaliteit
        );
      };

      img.onerror = () => {
        reject(new Error('Fout bij het laden van de afbeelding.'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Fout bij het lezen van het bestand.'));
    };
  });
};