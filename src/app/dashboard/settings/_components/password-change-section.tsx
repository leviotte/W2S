/**
 * src/app/dashboard/settings/_components/password-change-section.tsx
 *
 * GOUDSTANDAARD VERSIE: Met correcte JSX event handlers.
 */
"use client";

import React, { useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export function PasswordChangeSection() {
  const { updateUserPassword, loading } = useAuthStore((state) => ({
    updateUserPassword: state.updateUserPassword,
    loading: state.loading,
  }));

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = useCallback((field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("De nieuwe wachtwoorden komen niet overeen.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Je nieuwe wachtwoord moet minstens 6 tekens lang zijn.");
      return;
    }

    // De store zal de toast voor success of error tonen.
    await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);
    
    // Reset form on success (we kunnen de error state checken indien nodig, maar dit is meestal ok)
    setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wachtwoord Wijzigen</CardTitle>
        <CardDescription>
          Werk hier je wachtwoord bij. Na het opslaan word je mogelijk uitgelogd.
        </CardDescription>
      </CardHeader>
      {/* CORRECTIE: Correcte onSubmit syntax */}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Huidig Wachtwoord</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              // CORRECTIE: Correcte onChange syntax
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Bevestig Nieuw Wachtwoord</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={(e) => handleChange("confirmNewPassword", e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Wijzigen..." : "Wachtwoord Opslaan"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}