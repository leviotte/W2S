// src/components/PasswordChangeSection.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "react-toastify";

const inputClasses =
  "mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:ring-opacity-50 bg-white px-3 py-2";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function PasswordChangeSection() {
  const { updatePassword } = useStore();
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChange = useCallback(
    (field: keyof PasswordData, value: string) => {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        toast.error("De nieuwe wachtwoorden komen niet overeen");
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error("Jouw nieuw wachtwoord moet minstens 6 tekens lang zijn");
        return;
      }

      try {
        setIsChangingPassword(true);
        await updatePassword(passwordData.currentPassword, passwordData.newPassword);
        toast.success("Wachtwoord veranderd");
        setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      } catch (error: any) {
        if (error.code === "auth/wrong-password") {
          toast.error("Huidig wachtwoord niet juist");
        } else {
          toast.error("Fout bij het veranderen van wachtwoord");
        }
      } finally {
        setIsChangingPassword(false);
      }
    },
    [passwordData, updatePassword]
  );

  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-xl font-semibold text-accent mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-accent">Current Password</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => handleChange("currentPassword", e.target.value)}
            className={inputClasses}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-accent">Nieuw Wachtwoord</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            className={inputClasses}
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-accent">Bevestig Nieuw Wachtwoord</label>
          <input
            type="password"
            value={passwordData.confirmNewPassword}
            onChange={(e) => handleChange("confirmNewPassword", e.target.value)}
            className={inputClasses}
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isChangingPassword}
            className="bg-warm-olive text-white px-4 py-2 rounded-md hover:bg-cool-olive disabled:opacity-50"
          >
            {isChangingPassword ? "Wijzigen..." : "Wijzig wachtwoord"}
          </button>
        </div>
      </form>
    </div>
  );
}
