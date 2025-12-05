import { toast } from "sonner";

/**
 * Compress an image file to a maximum dimension of 1024x1024 and JPEG quality 0.7
 * @param file - Image file to compress
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Maintain aspect ratio
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            // Warn if still over 1MB
            if (compressedFile.size > 1024 * 1024) {
              toast.warning(
                "The image is still bigger than 1MB, try a smaller image."
              );
            }

            resolve(compressedFile);
          },
          "image/jpeg",
          0.7
        );
      };

      img.onerror = () => {
        reject(new Error("Error loading image"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
  });
};
