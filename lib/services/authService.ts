// lib/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as fbUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
} from "firebase/auth";

import { getClientAuth } from "@/lib/firebase";
import { databaseService } from "./databaseService";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Client-side auth helper. Must be invoked from client-only code.
 */
const auth = getClientAuth();

export const authService = {
  /**
   * Register new user + create Firestore profile.
   * Note: databaseService.create uses serverTimestamp for createdAt/updatedAt.
   */
  async register({ email, password, firstName, lastName }: RegisterPayload) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user profile in Firestore (client write).
    // databaseService.create will add serverTimestamp fields.
    await databaseService.create("users", user.uid, {
      firstName,
      lastName,
      email,
      firstName_lower: (firstName || "").toLowerCase(),
      lastName_lower: (lastName || "").toLowerCase(),
      notifications: { email: true },
    });

    // Update Firebase Auth profile
    await updateProfile(user, { displayName: `${firstName} ${lastName}` });

    // Trigger email verification
    await sendEmailVerification(user);

    return user;
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
    // setPersistence already configured in lib/firebase via setPersistence
    const user = (await signInWithEmailAndPassword(auth, email, password)).user;
    return user;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Reset password email
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Update user password (requires re-auth)
   */
  async updatePassword(user: User, currentPassword: string, newPassword: string) {
    if (!user.email) {
      throw new Error("User has no email defined");
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await fbUpdatePassword(user, newPassword);
  },
};
