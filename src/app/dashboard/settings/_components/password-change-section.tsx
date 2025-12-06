/**
 * src/app/dashboard/settings/_components/password-change-section.tsx
 * 
 * GOLD STANDARD VERSIE: Met correcte event handlers en state management.
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
  // Correcte hook aanroep
  const { updatePassword, loading } = useAuthStore((state) => ({ 
    updatePassword: state.updatePassword,
    loading: state.loading 
  }));
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = useCallback((field: keyof PasswordData, value: string) => {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    },[]);

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

    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      // 'toast.success' wordt al afgehandeld in de store
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error) {
      // 'toast.error' wordt al afgehandeld in de store, dus hier hoeft niets extra's.
      console.log("Submit failed, error handled by store.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wachtwoord Wijzigen</CardTitle>
        <CardDescription>
          Werk hier je wachtwoord bij. Na het opslaan word je mogelijk uitgelogd.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Huidig Wachtwoord</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
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