"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// We gaan ervan uit dat DateInput nog komt, voor nu geen fout.
import { DatePicker } from '@/components/ui/date-picker';
// 1. 'SubProfile' is verwijderd, we hebben alleen 'UserProfile' nodig.
import type { UserProfile } from "@/types/user";

// 2. Het type is nu een stuk simpeler en gebaseerd op ons enige, ware UserProfile type.
type PersonalInfoData = Partial<UserProfile> & { isProfile?: boolean };

interface PersonalInfoSectionProps {
  data: PersonalInfoData;
  onFieldChange: (field: keyof PersonalInfoData, value: string) => void;
}

export default function PersonalInfoSection({ data, onFieldChange }: PersonalInfoSectionProps) {
  return (
    <div className="bg-card shadow-lg rounded-lg p-6 border"> {/* Stijl-update naar card voor consistentie */}
      <h2 className="text-xl font-semibold text-card-foreground mb-4">Persoonlijke Gegevens</h2>
      <div className="space-y-4">
        {!data.isProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Voornaam</Label>
              {/* 3. Correcte JSX syntax: prop naam 'onChange' toegevoegd */}
              <Input id="firstName" value={data.firstName || ''} onChange={(e) => onFieldChange('firstName', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Achternaam</Label>
              {/* 3. Correcte JSX syntax: prop naam 'onChange' toegevoegd */}
              <Input id="lastName" value={data.lastName || ''} onChange={(e) => onFieldChange('lastName', e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="name">Profielnaam</Label>
            {/* 3. Correcte JSX syntax: 'name' is nu 'displayName' in ons schema */}
            <Input id="name" value={data.displayName || ''} onChange={(e) => onFieldChange('displayName', e.target.value)} />
          </div>
        )}
        
        <div>
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" value={data.email || ''} disabled />
        </div>

        <div>
          <Label htmlFor="phone">Telefoonnummer</Label>
          {/* 3. Correcte JSX syntax: prop naam 'onChange' toegevoegd */}
          <Input id="phone" type="tel" value={data.phone || ''} onChange={(e) => onFieldChange('phone', e.target.value)} />
        </div>

        <div>
    <DatePicker
        id="birthdate"
        label="Geboortedatum"
        // De waarde moet een Date-object zijn, of undefined
        value={data.birthdate ? new Date(data.birthdate) : undefined} 
        // De prop heet nu onValueChange en geeft een Date object terug
        onValueChange={(date) => {
            // We zetten het om naar een ISO string om op te slaan, zoals voorheen
            onFieldChange('birthdate', date ? date.toISOString() : '')
        }}
        // De maximale datum is nu ook een Date object
        toDate={new Date()}
    />
</div>
      </div>
    </div>
  );
}