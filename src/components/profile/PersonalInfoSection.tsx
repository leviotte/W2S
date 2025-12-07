// src/components/profile/PersonalInfoSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DateInput from "@/components/DateInput";
import type { UserProfile, SubProfile } from "@/types/user";

// Dit type maakt de data flexibel
type PersonalInfoData = Partial<UserProfile & SubProfile> & { isProfile?: boolean };

interface PersonalInfoSectionProps {
  data: PersonalInfoData;
  onFieldChange: (field: keyof PersonalInfoData, value: string) => void;
}

export default function PersonalInfoSection({ data, onFieldChange }: PersonalInfoSectionProps) {
  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-lg font-semibold text-accent mb-4">Persoonlijke Gegevens</h2>
      <div className="space-y-4">
        {!data.isProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Voornaam</Label>
              <Input id="firstName" value={data.firstName || ''} onChange={(e) => onFieldChange('firstName', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Achternaam</Label>
              <Input id="lastName" value={data.lastName || ''} onChange={(e) => onFieldChange('lastName', e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="name">Profielnaam</Label>
            <Input id="name" value={data.name || ''} onChange={(e) => onFieldChange('name', e.target.value)} />
          </div>
        )}
        
        <div>
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" value={data.email || ''} disabled />
        </div>

        <div>
          <Label htmlFor="phone">Telefoonnummer</Label>
          <Input id="phone" type="tel" value={data.phone || ''} onChange={(e) => onFieldChange('phone', e.target.value)} />
        </div>

        <div>
          <DateInput
            id="birthdate"
            label="Geboortedatum"
            value={data.birthdate || ''}
            onChange={(value) => onFieldChange('birthdate', value)}
            maxDate={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>
    </div>
  );
}