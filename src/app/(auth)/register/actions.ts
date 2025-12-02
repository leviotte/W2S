"use server";

import { authService } from "@/src/lib/services/authService";

export async function registerAction(formData: FormData) {
  return await authService.register({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
  });
}
