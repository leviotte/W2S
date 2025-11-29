// src/components/PasswordResetForm.tsx
"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { Loader2 } from "lucide-react";

interface PasswordResettingFormProps {
  isOpen: boolean;
  onClose: () => void;
  backToLogin?: () => void;
}

export default function PasswordResetForm({
  isOpen,
  onClose,
  backToLogin,
}: PasswordResettingFormProps) {
  const [email, setEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);

  if (!isOpen) return null;

  const handlePasswordReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
        toast.error("Voer je E-mail in om je wachtwoord te resetten");
        return;
      }

      setIsEmailSending(true);
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success("Ga naar je E-mail om je wachtwoord te resetten");
        onClose();
        backToLogin?.();
      } catch (err) {
        if (err instanceof FirebaseError) {
          console.error("Firebase Error in handlePasswordReset:", err);
          switch (err.code) {
            case "auth/invalid-email":
              toast.error("Onjuist E-mailadres.");
              break;
            case "auth/user-not-found":
              toast.error("Geen gebruiker gevonden met dit E-mailadres.");
              break;
            default:
              toast.error("Fout bij versturen, probeer later nogmaals.");
          }
        } else {
          console.error("Unexpected error in handlePasswordReset:", err);
          toast.error("Onverwachte fout. Probeer later.");
        }
      } finally {
        setIsEmailSending(false);
      }
    },
    [email, onClose, backToLogin]
  );

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-1">
          <form onSubmit={handlePasswordReset} className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-2">
              <h1 className="text-2xl font-bold">Reset Wachtwoord</h1>
              <p className="text-balance text-muted-foreground">
                Reset het wachtwoord voor Wish2Share
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isEmailSending} className="w-full flex items-center justify-center gap-2">
              {isEmailSending ? (
                <>
                  <Loader2 className="animate-spin" />
                  E-mail wordt verstuurd...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center text-sm">
              Terug naar{" "}
              <button
                type="button"
                onClick={backToLogin}
                className="underline underline-offset-4"
              >
                Log in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Controleer je inbox na het invoeren van je E-mail
      </div>
    </div>
  );
}
