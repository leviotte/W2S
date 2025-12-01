"use client";

import { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import { toast } from "sonner";
import { validateBirthdate } from "@/utils/validation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import DateInput from "@/components/DateInput";
import { useRouter } from "next/navigation";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  gender: string;
  country: string;
  location: string;
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: RegisterModalProps) {
  const initialFormData: FormData = {
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    gender: "",
    country: "",
    location: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [birthdateError, setBirthdateError] = useState<string>();
  const { register, loading, error } = useStore();
  const router = useRouter();

  if (!isOpen) return null;

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    const birthdateValidation = validateBirthdate(formData.birthdate);
    if (!birthdateValidation.isValid) {
      setBirthdateError(birthdateValidation.message);
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.birthdate,
        `user${Math.random().toFixed(12).toString()?.split(".")[1]}`,
        formData.gender,
        formData.location,
        formData.country,
        (redirectPath: string) => router.push(redirectPath)
      );

      setFormData(initialFormData);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Provide valid input");
    }
  };

  const handleBirthdateChange = (value: string) => {
    setFormData({ ...formData, birthdate: value });
    setBirthdateError(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 z-0 bg-opacity-75"
          onClick={onClose}
        />

        <div className="flex flex-col z-50 rounded-lg items-center justify-center bg-slate-50 p-6 md:p-10">
          <div className="w-full max-w-sm md:max-w-3xl md:p-2">
            <div className={cn("flex flex-col gap-6")}>
              <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-1">
                  <form onSubmit={handleEmailRegister} className="p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold">Welkom</h1>
                      <p className="text-balance text-muted-foreground">
                        Creëer een Wish2Share-account
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="firstName">Voornaam</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Voornaam"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Achternaam</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Achternaam"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="birthdate">Geboortedatum</Label>
                      <DateInput
                        label=""
                        id="birthdate"
                        value={formData.birthdate}
                        onChange={handleBirthdateChange}
                        error={birthdateError}
                        required
                        maxDate={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="border text-sm border-input rounded-md p-2 focus:outline-none focus:ring-transparent"
                      >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="not_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-full">
                        <Label>Land</Label>
                        <Input
                          type="text"
                          placeholder="Land"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                      <div className="w-full">
                        <Label>Locatie</Label>
                        <Input
                          type="text"
                          placeholder="Locatie"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="naam@voorbeeld.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="password">Wachtwoord</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Bevestig Wachtwoord</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>

                    {error && <p className="text-sm text-[#b34c4c]">{error}</p>}

                    <Button disabled={loading} type="submit" className="w-full flex justify-center items-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : "Create account"}
                      {loading && " Account Creëren..."}
                    </Button>

                    <div className="text-center text-sm">
                      Heb je al een account?{" "}
                      <button onClick={onSwitchToLogin} className="underline underline-offset-4">
                        Log in
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                Door het creëren van een nieuw account ga je akkoord met onze{" "}
                <a href="/terms-and-conditions">Gebruiksvoorwaarden</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
