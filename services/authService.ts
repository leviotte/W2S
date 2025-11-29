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
  User
} from "firebase/auth";

import { auth } from "@/config/firebase";
import { databaseService } from "./database";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  /**
   * Register new user + create Firestore profile
   */
  async register({ email, password, firstName, lastName }: RegisterPayload) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore user profile
    await databaseService.create("users", user.uid, {
      firstName,
      lastName,
      email,
      firstName_lower: firstName.toLocaleLowerCase(),
      lastName_lower: lastName.toLocaleLowerCase(),
      notifications: {
        email: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    // Trigger email verification
    await sendEmailVerification(user);

    return user;
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
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
  }
};
